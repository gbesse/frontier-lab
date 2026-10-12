"""Gymnasium adapter / Adaptateur Gymnasium / Adaptador Gymnasium.

Requires / Nécessite / Requiere: Python 3.10+, gymnasium, numpy, Node.js 22+.
"""
import json
import subprocess
from pathlib import Path

import gymnasium as gym
import numpy as np
from gymnasium import spaces


class MicroFabEnv(gym.Env):
    """Actions: finish, measure, deposit, remove. / finir, mesurer, déposer, retirer.
    Acciones: terminar, medir, depositar, retirar. Magnitude: [0, 2 × target].
    """

    metadata = {"render_modes": []}

    def __init__(self, config=None):
        super().__init__()
        root = Path(__file__).resolve().parents[1]
        self.config = config or json.loads((root / "fixtures/demo.json").read_text())
        self.config = dict(self.config)
        self.action_space = spaces.Box(
            low=np.array([0.0, 0.0], dtype=np.float32),
            high=np.array([3.999, 1.0], dtype=np.float32),
            dtype=np.float32,
        )
        self.observation_space = spaces.Box(
            low=-np.inf, high=np.inf, shape=(6,), dtype=np.float32
        )
        self.process = subprocess.Popen(
            ["node", str(root / "bin/bridge.js")],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, bufsize=1,
        )
        self.episode = 0

    def _request(self, payload):
        self.process.stdin.write(json.dumps(payload) + "\n")
        self.process.stdin.flush()
        result = json.loads(self.process.stdout.readline())
        if not result["ok"]:
            raise ValueError(result["error"])
        return result

    def _observation(self, obs):
        # A separate availability flag distinguishes no reading from a true zero.
        return np.array([
            obs["targetUm"], obs["toleranceUm"],
            0.0 if obs["measuredUm"] is None else obs["measuredUm"],
            float(obs["measuredUm"] is not None),
            obs["remainingBudget"], obs["remainingSteps"],
        ], dtype=np.float32)

    def reset(self, *, seed=None, options=None):
        super().reset(seed=seed)
        if seed is not None:
            self.config["seed"] = int(seed) % (2 ** 32)
            self.episode = 0
        episode = (options or {}).get("episode", self.episode)
        data = self._request({"command": "reset", "config": self.config, "episode": episode})
        self.episode = episode + 1
        return self._observation(data["observation"]), {}

    def step(self, action):
        if not self.action_space.contains(np.asarray(action, dtype=np.float32)):
            raise ValueError("Action invalide / Invalid action / Acción no válida")
        kind = ["finish", "measure", "deposit", "remove"][int(action[0])]
        data = self._request({"command": "step", "action": {
            "type": kind, "amountUm": max(1e-9, float(action[1]) * self.config["targetUm"] * 2),
        }})
        return (self._observation(data["observation"]), float(data["reward"]),
                bool(data["terminated"]), bool(data["truncated"]),
                {"result": data["result"]} if "result" in data else {})

    def close(self):
        if self.process.poll() is None:
            self.process.stdin.close()
            self.process.terminate()
            self.process.wait(timeout=5)
