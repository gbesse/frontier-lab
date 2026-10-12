import java.util.Locale;
import org.hipparchus.geometry.euclidean.threed.Vector3D;
import org.orekit.frames.FramesFactory;
import org.orekit.orbits.CartesianOrbit;
import org.orekit.propagation.analytical.KeplerianPropagator;
import org.orekit.time.AbsoluteDate;
import org.orekit.utils.PVCoordinates;

// Common inertial initial vectors, identical mu, seconds and metres in both engines.
// Only relative elapsed time is used: no EOP or UTC conversion is implied here.
public class OrekitAdapter {
  public static void main(String[] args) {
    Locale.setDefault(Locale.ROOT);
    if (args.length != 9) throw new IllegalArgumentException("9 numeric arguments");
    double[] a = new double[9];
    for (int i = 0; i < 9; i++) {
      a[i] = Double.parseDouble(args[i]);
      if (!Double.isFinite(a[i])) throw new IllegalArgumentException("finite numbers");
    }
    AbsoluteDate origin = AbsoluteDate.J2000_EPOCH;
    CartesianOrbit orbit = new CartesianOrbit(new PVCoordinates(
      new Vector3D(a[0], a[1], a[2]), new Vector3D(a[3], a[4], a[5])),
      FramesFactory.getGCRF(), origin, a[6]);
    KeplerianPropagator engine = new KeplerianPropagator(orbit);
    StringBuilder out = new StringBuilder("[");
    for (int i = 0; i <= (int)(a[7] / a[8]); i++) {
      double time = i * a[8];
      PVCoordinates pv = engine.propagate(origin.shiftedBy(time)).getPVCoordinates();
      if (i > 0) out.append(',');
      out.append(String.format(Locale.ROOT,"[%.9f,%.12f,%.12f,%.12f,%.12f,%.12f,%.12f]",
        time, pv.getPosition().getX(), pv.getPosition().getY(), pv.getPosition().getZ(),
        pv.getVelocity().getX(), pv.getVelocity().getY(), pv.getVelocity().getZ()));
    }
    System.out.println(out.append(']'));
  }
}
