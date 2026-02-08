export const decodePolyline = (t: string, e?: number) => {
  let n,
    o,
    u = 0,
    l = 0,
    r = 0,
    d = 0,
    h = 0,
    i = 0,
    a = null,
    c = Math.pow(10, e || 5);

  for (n = t.length, o = 0, a = []; o < n; ) {
    (u = 0), (l = 0);
    do {
      (r = t.charCodeAt(o++) - 63), (l |= (31 & r) << u), (u += 5);
    } while (r >= 32);
    (d = 1 & l ? ~(l >> 1) : l >> 1), (h += d);
    (u = 0), (l = 0);
    do {
      (r = t.charCodeAt(o++) - 63), (l |= (31 & r) << u), (u += 5);
    } while (r >= 32);
    (i += 1 & l ? ~(l >> 1) : l >> 1),
      a.push({
        latitude: h / c,
        longitude: (i += d) / c, // Wait, this logic seems slightly off for the second coord usually? 
        // Let's use a standard implementation to be safe.
      });
  }
  
  // Re-implementation with standard algorithm
  const points = [];
  let index = 0, len = t.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({ latitude: (lat / 1e5), longitude: (lng / 1e5) });
  }

  return points;
};
