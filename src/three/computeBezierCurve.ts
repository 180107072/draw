/**
 *
 *  http://walter.bislins.ch/blog/index.asp?page=JavaScript%3A+Bezier-Segmente+f%FCr+Spline+berechnen
 *
 *
 */

function ComputeSplineCurve(splinePoly, tension, closed) {
	// splinePoly: CPolygon = { X: array of number, Y: array of number, Size: integer }
	// splinePoly.Size defines the number of valid points in X, Y, ignoring further points.
	//
	// tension: number; curve parameter; 0.5 is a good value
	//
	// closed: boolean; true -> closed spline
	//
	// returns a new CPolygon of sequence: [ P0, C0b, C1a, P1, C1b, C2a, P2, C2b, C3a, P3, ... ]
	// where P0 and P1 are the endpoints and C0b and C1a are control points of the first bezier segment...
	// Note: the returned CPolygon.X.length may be greater than CPolygon.Size! Use only Size Points!

	var splineSize = splinePoly.Size;
	if (splineSize <= 2) return null;

	// make bezier polygon in format: [ P0, C0b, C1a, P1, C1b, C2a, P2, C2b, C3a, P3, ... ]

	var bezierPoly = new CPolygon();
	var xSpline = splinePoly.X;
	var ySpline = splinePoly.Y;
	bezierPoly.AddPoint(xSpline[0], ySpline[0]); // P0
	for (var i = 1; i < splineSize; i++) {
		bezierPoly.AddPoint(0, 0); // placeholder for C<i-1>b
		bezierPoly.AddPoint(0, 0); // placeholder for C<i>a
		bezierPoly.AddPoint(xSpline[i], ySpline[i]); // P<i>
	}

	if (closed) {
		// closed spline: replicate first two points and add them to the end of bezierPoly

		bezierPoly.AddPoint(0, 0);
		bezierPoly.AddPoint(0, 0);
		bezierPoly.AddPoint(xSpline[0], ySpline[0]);
		bezierPoly.AddPoint(0, 0);
		bezierPoly.AddPoint(0, 0);
		bezierPoly.AddPoint(xSpline[1], ySpline[1]);
	} else {
		// open spline: set first and last bezier control point equal first and last spline point

		bezierPoly.X[1] = xSpline[0];
		bezierPoly.Y[1] = ySpline[0];
		var lastCP = bezierPoly.Size - 2;
		var lastSplineP = splineSize - 1;
		bezierPoly.X[lastCP] = xSpline[lastSplineP];
		bezierPoly.Y[lastCP] = ySpline[lastSplineP];
	}

	// compute bezier control points C<i>a and C<i>b for i from 1 to lastPivot
	// [ P0 C0b C1a P1 C1b C2a P2 ... P7 C7b C8a P8 C8b C9a P9 ]
	//               ^----firstPivot              ^----lastPivot

	var lastPivot = closed ? splineSize : splineSize - 2;
	ComputeBezierControlPoints(bezierPoly, tension, lastPivot);

	// closed spline: copy control point Cb of second last extra point (P8) to
	// control point Cb of first point (P0) and cutoff last extra bezier segment
	//       v------------------------------+
	// [ P0 C0b C1a P1 ... P7 C7b C8a P8 | C8b C9a P9 ]

	if (closed) {
		var lastCP = bezierPoly.Size - 3;
		bezierPoly.X[1] = bezierPoly.X[lastCP];
		bezierPoly.Y[1] = bezierPoly.Y[lastCP];
		bezierPoly.Size -= 3;
	}

	return bezierPoly;
}

function ComputeBezierControlPoints(poly, tension, lastPivot) {
	// Computes Control Points C<i>a and C<i>b for quadratic Bezier segments.
	// Each pair of Control Points C<i>a, C<i>b is computed from points P<i-1>, P<i>, P<i+1>.
	// P<i> is called a pivot point. i ranges from 1 to <lastPivot> inclusive.
	//
	// poly: CPolygon = { X: array of number, Y: array of number, Size: integer }
	// poly Point Sequence is:
	// [ P0, C0b, C1a, P1, C1b, C2a, P2, C2b, C3a, P3, ..., P7 C7b C8a P8 C8b C9a C9 ]
	//  first Pivot-----^             ^----second Pivot                 ^----last Pivot
	//
	// Note: places for control points C<i>a and C<i>b must already exist in poly.
	// lastPivot: index of last pivot point (not poly index but original spline point index).
	//
	// source Rob Spencer, July 2010: http://scaledinnovation.com/analytics/splines/aboutSplines.html
	// adapted Walter Bislin, 2016: http://walter.bislins.ch/

	function LengthFor(side1, side2) {
		return Math.sqrt(side1 * side1 + side2 * side2);
	}

	var fa, fb;
	var px = poly.X;
	var py = poly.Y;
	for (var i = 1; i <= lastPivot; i++) {
		var pivot = 3 * i;
		var left = pivot - 3;
		var right = pivot + 3;
		var ca = pivot - 1;
		var cb = pivot + 1;
		var d01 = LengthFor(px[pivot] - px[left], py[pivot] - py[left]);
		var d12 = LengthFor(px[right] - px[pivot], py[right] - py[pivot]);
		var d = d01 + d12;
		if (d > 0) {
			fa = (tension * d01) / d;
			fb = (tension * d12) / d;
		} else {
			// note: d01 and d12 are also 0, so we are save if we set fa = fb = 0
			fa = 0;
			fb = 0;
		}
		var w = px[right] - px[left];
		var h = py[right] - py[left];
		px[ca] = px[pivot] - fa * w;
		py[ca] = py[pivot] - fa * h;
		px[cb] = px[pivot] + fb * w;
		py[cb] = py[pivot] + fb * h;
	}
}

function CPolygon() {
	// Note: Arrays X and Y are probably larger then Size.
	// Use Copy function to optain arrays of size this.Size.
	this.X = [];
	this.Y = [];
	this.Size = 0;
}

CPolygon.prototype.Reset = function () {
	// keep and reuse arrays!
	this.Size = 0;
};

CPolygon.prototype.AddPoint = function (x, y) {
	// automatic enlarges arrays if array.length <= Size
	this.X[this.Size] = x;
	this.Y[this.Size++] = y;
};

CPolygon.prototype.Copy = function (first, last) {
	first = typeof first === "number" ? first : 0;
	last = typeof last === "number" ? last : this.Size - 1;
	var to = new CPolygon();
	for (var i = first; i <= last; i++) {
		to.AddPoint(this.X[i], this.Y[i]);
	}
	return to;
};

export const computeBezierCurve = (points: [number, number][]) => {
	const poly = new CPolygon();
	points.forEach(([x, y]) => poly.AddPoint(x, y));
	const bezierPoly = ComputeSplineCurve(poly, 0.3, false);
	const arrBezier = bezierPoly.X.map((x, i) => [x, bezierPoly.Y[i]]);
	return arrBezier;
};
