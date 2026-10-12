"""Execute actual installed engines; never substitute synthetic engine results."""
import contextlib
import hashlib
import importlib.metadata
import io
import json
import math
import os
from pathlib import Path
import subprocess
import sys
import tempfile


def sha(path):
    with open(path, "rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def verified(runtime, name):
    manifest = json.loads((Path(__file__).parent / "datasets.json").read_text())
    data = next(x for x in manifest["datasets"] if x["id"] == name)
    path = runtime / data["file"]
    if path.stat().st_size != data["bytes"] or sha(path) != data["sha256"]:
        raise ValueError("DATASET_INTEGRITY")
    return path, data


def version(name):
    return importlib.metadata.version(name)


def satellite(runtime):
    from sgp4.api import Satrec
    path, data = verified(runtime, "iss-2026-10-10")
    lines = path.read_text().splitlines()
    sat = Satrec.twoline2rv(lines[1], lines[2])
    return sat, data


def benchmark(runtime, config):
    import numpy as np
    from Basilisk.utilities import SimulationBaseClass, simIncludeGravBody, macros
    from Basilisk.simulation import spacecraft
    step = config["stepSec"]
    if step not in [10, 30, 60, 120] or config["profile"] not in ["iss", "moon"]:
        raise ValueError("CONFIG")
    sample = 120
    duration = 10800 if config["profile"] == "iss" else 86400
    times = np.arange(0, duration + sample, sample)
    if config["profile"] == "iss":
        sat, data = satellite(runtime)
        def truth(t):
            error, r, v = sat.sgp4(sat.jdsatepoch, sat.jdsatepochF + t / 86400)
            if error: raise ValueError("SGP4")
            return np.array([*r, *v]) * 1000
        initial = truth(0)
        mu = 3.986004418e14
        epoch = {"julianDate": sat.jdsatepoch + sat.jdsatepochF, "frame": "TEME_FIXED_AXES"}
        sources = [data]
        reference = "SGP4_PERTURBED_REFERENCE"
    else:
        import spiceypy as spice
        kernel, data = verified(runtime, "de440s")
        leaps, leap_data = verified(runtime, "naif0012")
        spice.furnsh(str(kernel)); spice.furnsh(str(leaps))
        et = spice.str2et("2026-10-10T12:00:00")
        def truth(t):
            state, _ = spice.spkezr("MOON", et + t, "J2000", "NONE", "EARTH")
            return np.array(state) * 1000
        initial = truth(0)
        mu = 4.035032355e14  # Earth + Moon gravitational parameters, m^3/s^2.
        epoch = {"utc": "2026-10-10T12:00:00Z", "frame": "J2000"}
        sources = [data, leap_data]
        reference = "JPL_DE440S_GEOMETRIC_EARTH_MOON"
    truth_states = np.array([truth(float(t)) for t in times])
    sim = SimulationBaseClass.SimBaseClass()
    sim.CreateNewProcess("dynamics").addTask(sim.CreateNewTask("orbit", macros.sec2nano(step)))
    body = spacecraft.Spacecraft(); body.ModelTag = "commons"
    gravity = simIncludeGravBody.gravBodyFactory()
    earth = gravity.createEarth(); earth.isCentralBody = True; earth.mu = mu
    gravity.addBodiesTo(body)
    body.hub.r_CN_NInit = initial[:3].tolist(); body.hub.v_CN_NInit = initial[3:].tolist()
    sim.AddModelToTask("orbit", body)
    log = body.scStateOutMsg.recorder(macros.sec2nano(sample))
    sim.AddModelToTask("orbit", log)
    sim.InitializeSimulation(); sim.ConfigureStopTime(macros.sec2nano(duration)); sim.ExecuteSimulation()
    bsk = np.column_stack([log.times() / 1e9, log.r_BN_N, log.v_BN_N])
    if len(bsk) != len(times) or not np.array_equal(bsk[:, 0], times): raise ValueError("SAMPLE_ALIGNMENT")
    settings = json.loads((runtime / "runtime.json").read_text())
    cp = str(runtime / "classes") + os.pathsep + str(runtime / "jars" / "*")
    command = [settings["java"], "-cp", cp, "OrekitAdapter", *[str(float(x)) for x in initial], str(mu), str(duration), str(sample)]
    orekit = np.array(json.loads(subprocess.check_output(command, timeout=25, text=True)))
    difference = np.linalg.norm(bsk[:, 1:4] - orekit[:, 1:4], axis=1)
    residual = np.linalg.norm(orekit[:, 1:4] - truth_states[:, :3], axis=1)
    energy = .5 * np.sum(bsk[:, 4:] ** 2, axis=1) - mu / np.linalg.norm(bsk[:, 1:4], axis=1)
    drift = float(np.max(np.abs((energy - energy[0]) / energy[0])))
    maximum = float(difference.max())
    return {"engines": [{"name": "Basilisk", "version": version("bsk"), "method": "RK4"}, {"name": "Orekit", "version": "13.1.9", "method": "KeplerianPropagator"}, {"name": "SGP4" if config["profile"] == "iss" else "CSPICE / SpiceyPy", "version": version("sgp4" if config["profile"] == "iss" else "spiceypy"), "method": reference}], "sources": sources, "epoch": epoch, "muM3S2": mu, "durationSec": duration, "sampleSec": sample, "maxEngineDifferenceM": maximum, "maxReferenceResidualM": float(residual.max()), "relativeEnergyDrift": drift, "toleranceM": 100, "passed": maximum <= 100, "samples": [{"timeSec": float(t), "basiliskM": bsk[i, 1:4].tolist(), "orekitM": orekit[i, 1:4].tolist(), "referenceM": truth_states[i, :3].tolist(), "engineDifferenceM": float(difference[i]), "referenceResidualM": float(residual[i])} for i, t in enumerate(times)]}


def contact_windows(runtime):
    import numpy as np
    from sgp4.api import Satrec
    from sgp4.functions import jday
    from sgp4.propagation import gstime
    sat, source = satellite(runtime)
    # Scenario antennas at city coordinates, not operational station claims.
    stations = [("paris", 48.8566, 2.3522, 2), ("tenerife", 28.2916, -16.6291, 1), ("canberra", -35.2809, 149.13, 3)]
    contacts = []
    for name, latitude, longitude, price in stations:
        lat, lon = math.radians(latitude), math.radians(longitude)
        n = 6378137 / math.sqrt(1 - .00669437999014 * math.sin(lat) ** 2)
        ground = np.array([n * math.cos(lat) * math.cos(lon), n * math.cos(lat) * math.sin(lon), n * (1 - .00669437999014) * math.sin(lat)])
        up = np.array([math.cos(lat) * math.cos(lon), math.cos(lat) * math.sin(lon), math.sin(lat)])
        active = []
        def close():
            if len(active) >= 3:
                contacts.append({"id": f"{name}-{active[0][0]}", "station": name, "start": active[0][0], "end": active[-1][0], "maxElevationDeg": max(x[1] for x in active), "latencySec": max(x[2] for x in active) / 299792458, "rateBytesPerSec": 64000, "pricePerMbUnits": price})
        for t in range(0, 86401, 30):
            error, r, _ = sat.sgp4(sat.jdsatepoch, sat.jdsatepochF + t / 86400)
            if error: raise ValueError("SGP4")
            angle = gstime(sat.jdsatepoch + sat.jdsatepochF + t / 86400)
            c, s = math.cos(angle), math.sin(angle)
            fixed = np.array([c * r[0] + s * r[1], -s * r[0] + c * r[1], r[2]]) * 1000
            los = fixed - ground; distance = float(np.linalg.norm(los))
            elevation = math.degrees(math.asin(float(np.dot(los, up)) / distance))
            if elevation >= 10: active.append((t, elevation, distance))
            elif active: close(); active = []
        close()
    contacts.sort(key=lambda x: (x["start"], x["id"]))
    return contacts, source, sat.jdsatepoch + sat.jdsatepochF


def market(runtime, config):
    from ortools.sat.python import cp_model
    if config["budgetUnits"] not in [50, 100, 200] or config["outage"] not in ["none", "paris", "tenerife", "canberra"]: raise ValueError("CONFIG")
    contacts, source, epoch = contact_windows(runtime)
    active = [c for c in contacts if c["station"] != config["outage"]]
    # Declared scientific requests and valuations; geometric opportunities come from the TLE.
    state = config["seed"] & 0xffffffff
    def rand():
        nonlocal state
        state = (1664525 * state + 1013904223) & 0xffffffff
        return state
    requests = [{"id": f"science-{i+1}", "bytes": (4 + rand() % 9) * 1000000, "value": 10 + rand() % 91, "releaseAt": (i // 4) * 12000, "deadline": min(86400, (i // 4) * 12000 + 26000)} for i in range(16)]
    model = cp_model.CpModel(); choices = []; intervals = []
    by_request = {r["id"]: [] for r in requests}
    for r in requests:
        for c in active:
            duration = math.ceil(r["bytes"] / c["rateBytesPerSec"])
            first = max(r["releaseAt"], c["start"]); last = min(r["deadline"], c["end"]) - duration
            if last < first: continue
            take = model.new_bool_var(r["id"] + "/" + c["id"])
            start = model.new_int_var(first, last, "s-" + r["id"] + "/" + c["id"])
            end = model.new_int_var(first + duration, last + duration, "e-" + r["id"] + "/" + c["id"])
            interval = model.new_optional_interval_var(start, duration, end, take, "i-" + r["id"] + "/" + c["id"])
            cost = math.ceil(r["bytes"] / 1e6) * c["pricePerMbUnits"]
            choices.append((r, c, take, start, end, cost)); intervals.append(interval); by_request[r["id"]].append(take)
    for values in by_request.values(): model.add(sum(values) <= 1)
    model.add_no_overlap(intervals)
    model.add(sum(x[2] * x[5] for x in choices) <= config["budgetUnits"])
    model.maximize(sum(x[2] * (x[0]["value"] * 1000000 - x[5]) for x in choices))
    solver = cp_model.CpSolver(); solver.parameters.num_search_workers = 1; solver.parameters.random_seed = config["seed"] % 2147483647; solver.parameters.max_time_in_seconds = 5
    status = solver.solve(model)
    if status not in [cp_model.OPTIMAL, cp_model.FEASIBLE]: raise ValueError("SOLVER_NO_SOLUTION")
    awards = [{"requestId": r["id"], "contactId": c["id"], "station": c["station"], "start": solver.value(start), "end": solver.value(end), "bytes": r["bytes"], "scienceValue": r["value"], "costUnits": cost, "latencySec": c["latencySec"]} for r, c, take, start, end, cost in choices if solver.value(take)]
    awards.sort(key=lambda a: (a["start"], a["requestId"]))
    spent = sum(a["costUnits"] for a in awards)
    # First-come-first-served baseline using the same opportunities and constraints.
    baseline = []; left = config["budgetUnits"]; delivered = set(); free_at = 0
    for c in active:
        cursor = max(c["start"], free_at)
        for r in requests:
            cost = math.ceil(r["bytes"] / 1e6) * c["pricePerMbUnits"]
            start = max(cursor, r["releaseAt"]); end = start + math.ceil(r["bytes"] / c["rateBytesPerSec"])
            if r["id"] in delivered or cost > left or end > min(r["deadline"], c["end"]): continue
            baseline.append({"requestId":r["id"], "start":start, "end":end, "value":r["value"], "costUnits":cost})
            delivered.add(r["id"]); left -= cost; cursor = end; free_at = end
    # Validate the realized schedule independently of the optimizer's success code.
    valid = spent <= config["budgetUnits"] and len(set(a["requestId"] for a in awards)) == len(awards)
    for i, a in enumerate(awards):
        r = next(r for r in requests if r["id"] == a["requestId"]); c = next(c for c in active if c["id"] == a["contactId"])
        valid = valid and a["start"] >= max(r["releaseAt"], c["start"]) and a["end"] <= min(r["deadline"], c["end"]) and a["end"] - a["start"] >= math.ceil(a["bytes"] / c["rateBytesPerSec"]) and (i == 0 or awards[i-1]["end"] <= a["start"])
    if not valid: raise ValueError("SCHEDULE_INVARIANT")
    return {"engines": [{"name": "SGP4", "version": version("sgp4")}, {"name": "OR-Tools CP-SAT", "version": version("ortools")}], "sources": [source], "epochJulianDate": epoch, "contacts": contacts, "requests": requests, "awards": awards, "solverStatus": solver.status_name(status), "objectiveBound": solver.best_objective_bound, "objectiveValue": solver.objective_value, "scienceValue": sum(a["scienceValue"] for a in awards), "spentUnits": spent, "remainingUnits": config["budgetUnits"] - spent, "invariantsPassed": valid, "baseline": {"method":"first-come-first-served", "awards":baseline, "scienceValue":sum(a["value"] for a in baseline), "spentUnits":config["budgetUnits"]-left}}


def citizen(runtime, config):
    import numpy as np
    from blimpy import Waterfall
    from turbo_seti.find_doppler.find_doppler import FindDoppler
    if config["snr"] not in [10, 25, 50] or config["maxDriftHzSec"] not in [1, 4]: raise ValueError("CONFIG")
    path, source = verified(runtime, "voyager-1")
    # Restricted public observation band: same measured samples, no injected signal or invented OFF.
    wf = Waterfall(str(path), f_start=8419.24, f_stop=8419.35, max_load=.1)
    data = np.asarray(wf.data[:, 0, :], dtype=np.float64)
    with tempfile.TemporaryDirectory(prefix="citizen-", dir=runtime) as folder:
        excerpt = Path(folder) / "voyager-band.h5"
        wf.write_to_hdf5(str(excerpt))
        engine = FindDoppler(str(excerpt), max_drift=config["maxDriftHzSec"], snr=config["snr"], out_dir=folder, n_coarse_chan=1, gpu_backend=False, log_level_int=40)
        engine.search()
        hits = []
        for output in Path(folder).glob("*.dat"):
            for line in output.read_text().splitlines():
                if not line.strip() or line.startswith("#"): continue
                fields = line.split()
                if len(fields) >= 8:
                    hits.append({"id": int(fields[0]), "driftHzSec": float(fields[1]), "snr": float(fields[2]), "frequencyMHz": float(fields[3])})
        dat_hash = sha(next(Path(folder).glob("*.dat")))
    maxima = data.argmax(axis=1)
    axis = np.asarray(wf.container.populate_freqs(), dtype=np.float64)
    peak_mhz = axis[maxima]
    time_axis = np.arange(data.shape[0]) * float(wf.header["tsamp"])
    peak_drift = float(np.polyfit(time_axis, peak_mhz * 1e6, 1)[0])
    target_bins = 128
    parts = np.array_split(np.arange(data.shape[1]), target_bins)
    reduced = np.column_stack([data[:, bins].max(axis=1) for bins in parts])
    background = float(np.median(data)); view = (10 * np.log10(np.maximum(reduced, 1e-15) / max(background, 1e-15))).tolist()
    carrier = [hit for hit in hits if 8419.295 <= hit["frequencyMHz"] <= 8419.300]
    return {"engines": [{"name": "blimpy", "version": version("blimpy")}, {"name": "turboSETI", "version": version("turbo-seti"), "backend": "CPU"}], "sources": [source], "target": str(wf.header["source_name"]), "mjdStart": float(wf.header["tstart"]), "sampleSeconds": float(wf.header["tsamp"]), "channelHz": abs(float(wf.header["foff"]) * 1e6), "observedShape": list(data.shape), "bandMHz": [float(axis.min()), float(axis.max())], "hits": hits, "carrierHits": len(carrier), "measuredPeakDriftHzSec": peak_drift, "waterfallDb": view, "frequencyBinsMHz": [float(np.mean(axis[bins])) for bins in parts], "peakTrack": [{"timeSec": float(t), "frequencyMHz": float(f)} for t, f in zip(time_axis, peak_mhz)], "searchDatSha256": dat_hash, "classification": "known-human-spacecraft", "offObservationAvailable": False}


def main():
    runtime = Path(sys.argv[1]).resolve()
    kind = sys.argv[2]
    config = json.loads(sys.stdin.read(4096))
    with contextlib.redirect_stdout(io.StringIO()):
        result = {"benchmark": benchmark, "market": market, "citizen": citizen}[kind](runtime, config)
    print(json.dumps(result, allow_nan=False, separators=(",", ":")))


if __name__ == "__main__":
    main()
