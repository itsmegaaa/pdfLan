export const MAX_OUTPUT = 2400;

export function detectCorners(canvas) {
    const w = canvas.width, h = canvas.height;
    const defaultCorners = () => {
        const m = Math.round(Math.min(w, h) * 0.05);
        return [[m, m], [w - m, m], [w - m, h - m], [m, h - m]];
    };

    if (typeof cv === 'undefined' || !cv.Mat) {
        console.warn("OpenCV.js belum dimuat. Menggunakan posisi default.");
        return defaultCorners();
    }

    try {
        let src = cv.imread(canvas);
        
        // Scale down untuk kecepatan
        const scale = Math.min(1, 500 / Math.max(w, h));
        const sw = Math.round(w * scale), sh = Math.round(h * scale);
        let resized = new cv.Mat();
        cv.resize(src, resized, new cv.Size(sw, sh));

        // Konversi Grayscale
        let gray = new cv.Mat();
        cv.cvtColor(resized, gray, cv.COLOR_RGBA2GRAY, 0);

        // Gaussian Blur untuk meredam noise
        let blurred = new cv.Mat();
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

        // Canny edge detection
        let edges = new cv.Mat();
        cv.Canny(blurred, edges, 75, 200, 3, false);

        // Dilate untuk menyambung garis tepi yang terputus
        let dilated = new cv.Mat();
        let M = cv.Mat.ones(3, 3, cv.CV_8U);
        cv.dilate(edges, dilated, M, new cv.Point(-1, -1), 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

        // Cari Contour
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        let maxArea = 0;
        let bestPoly = null;

        for (let i = 0; i < contours.size(); i++) {
            let cnt = contours.get(i);
            let area = cv.contourArea(cnt);
            
            // Minimal 10% dari luas gambar
            if (area > (sw * sh) * 0.1 && area > maxArea) {
                let peri = cv.arcLength(cnt, true);
                let approx = new cv.Mat();
                cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
                
                // Cari bentuk segi empat
                if (approx.rows === 4) {
                    maxArea = area;
                    if (bestPoly) bestPoly.delete();
                    bestPoly = approx;
                } else {
                    approx.delete();
                }
            }
            cnt.delete();
        }

        let resultCorners = null;

        if (bestPoly) {
            let pts = [];
            for (let i = 0; i < 4; i++) {
                pts.push({
                    x: bestPoly.data32S[i * 2] / scale,
                    y: bestPoly.data32S[i * 2 + 1] / scale
                });
            }

            // Urutkan poin: Top-Left, Top-Right, Bottom-Right, Bottom-Left
            pts.sort((a, b) => a.y - b.y);
            const top = pts.slice(0, 2).sort((a, b) => a.x - b.x); // TL, TR
            const bottom = pts.slice(2, 4).sort((a, b) => b.x - a.x); // BR, BL
            
            resultCorners = [
                [top[0].x, top[0].y],
                [top[1].x, top[1].y],
                [bottom[0].x, bottom[0].y],
                [bottom[1].x, bottom[1].y]
            ];
            bestPoly.delete();
        }

        // Hapus memori WASM OpenCV (sangat penting!)
        src.delete(); resized.delete(); gray.delete(); blurred.delete(); 
        edges.delete(); dilated.delete(); M.delete();
        contours.delete(); hierarchy.delete();

        if (resultCorners) {
            const margin = Math.round(Math.min(w, h) * 0.008);
            return resultCorners.map(([x, y]) => [
                Math.max(0, Math.min(w - 1, Math.round(x) - margin)),
                Math.max(0, Math.min(h - 1, Math.round(y) - margin))
            ]);
        }

        return defaultCorners();

    } catch (e) {
        console.error("OpenCV gagal:", e);
        return defaultCorners();
    }
}

export function boxBlur(data, w, h, r) {
    const temp = new Float32Array(w * h);
    const out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let sum = 0, cnt = 0;
            for (let dx = -r; dx <= r; dx++) {
                const nx = x + dx;
                if (nx >= 0 && nx < w) { sum += data[y * w + nx]; cnt++; }
            }
            temp[y * w + x] = sum / cnt;
        }
    }
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let sum = 0, cnt = 0;
            for (let dy = -r; dy <= r; dy++) {
                const ny = y + dy;
                if (ny >= 0 && ny < h) { sum += temp[ny * w + x]; cnt++; }
            }
            out[y * w + x] = sum / cnt;
        }
    }
    return out;
}

export function otsuThreshold(data) {
    const hist = new Array(256).fill(0);
    for (let i = 0; i < data.length; i++) {
        hist[Math.min(255, Math.max(0, Math.round(data[i])))]++;
    }
    const total = data.length;
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sumB = 0, wB = 0, maxVar = 0, thresh = 128;
    for (let t = 0; t < 256; t++) {
        wB += hist[t];
        if (wB === 0) continue;
        const wF = total - wB;
        if (wF === 0) break;
        sumB += t * hist[t];
        const diff = sumB / wB - (sum - sumB) / wF;
        const v = wB * wF * diff * diff;
        if (v > maxVar) { maxVar = v; thresh = t; }
    }
    return thresh;
}

export function fitLine(pts) {
    if (pts.length < 2) return { m: 0, b: 0 };
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const [x, y] of pts) { sx += x; sy += y; sxx += x * x; sxy += x * y; }
    const n = pts.length, d = n * sxx - sx * sx;
    if (Math.abs(d) < 1e-10) return { m: 0, b: sy / n };
    return { m: (n * sxy - sx * sy) / d, b: (sy - ((n * sxy - sx * sy) / d) * sx) / n };
}

export function fitLineV(pts) {
    if (pts.length < 2) return { m: 0, b: 0 };
    let sx = 0, sy = 0, syy = 0, sxy = 0;
    for (const [x, y] of pts) { sx += x; sy += y; syy += y * y; sxy += x * y; }
    const n = pts.length, d = n * syy - sy * sy;
    if (Math.abs(d) < 1e-10) return { m: 0, b: sx / n };
    return { m: (n * sxy - sx * sy) / d, b: (sx - ((n * sxy - sx * sy) / d) * sy) / n };
}

export function intersectHV(hLine, vLine) {
    const denom = 1 - hLine.m * vLine.m;
    if (Math.abs(denom) < 1e-10) return null;
    const y = (hLine.m * vLine.b + hLine.b) / denom;
    const x = vLine.m * y + vLine.b;
    return [x, y];
}

export function isConvex(c) {
    function cross(o, a, b) {
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    }
    const d = [
        cross(c[0], c[1], c[2]),
        cross(c[1], c[2], c[3]),
        cross(c[2], c[3], c[0]),
        cross(c[3], c[0], c[1])
    ];
    const neg = d.some(v => v < 0);
    const pos = d.some(v => v > 0);
    return !(neg && pos);
}

export function computeOutputSize(corners) {
    const [tl, tr, br, bl] = corners;
    const topW = Math.sqrt((tr[0] - tl[0]) ** 2 + (tr[1] - tl[1]) ** 2);
    const botW = Math.sqrt((br[0] - bl[0]) ** 2 + (br[1] - bl[1]) ** 2);
    const leftH = Math.sqrt((bl[0] - tl[0]) ** 2 + (bl[1] - tl[1]) ** 2);
    const rightH = Math.sqrt((br[0] - tr[0]) ** 2 + (br[1] - tr[1]) ** 2);
    let w = Math.round(Math.max(topW, botW));
    let h = Math.round(Math.max(leftH, rightH));
    if (Math.max(w, h) > MAX_OUTPUT) {
        const s = MAX_OUTPUT / Math.max(w, h);
        w = Math.round(w * s);
        h = Math.round(h * s);
    }
    return { width: Math.max(1, w), height: Math.max(1, h) };
}

export function solve8x8(A, b) {
    const n = 8;
    const M = [];
    for (let i = 0; i < n; i++) M.push([...A[i], b[i]]);

    for (let col = 0; col < n; col++) {
        let maxVal = Math.abs(M[col][col]), maxRow = col;
        for (let row = col + 1; row < n; row++) {
            if (Math.abs(M[row][col]) > maxVal) { maxVal = Math.abs(M[row][col]); maxRow = row; }
        }
        [M[col], M[maxRow]] = [M[maxRow], M[col]];

        if (Math.abs(M[col][col]) < 1e-12) return null;

        for (let row = col + 1; row < n; row++) {
            const f = M[row][col] / M[col][col];
            for (let j = col; j <= n; j++) M[row][j] -= f * M[col][j];
        }
    }

    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
        x[i] = M[i][n];
        for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
        x[i] /= M[i][i];
    }
    return x;
}

export function computeHomography(src, dst) {
    const A = [], b = [];
    for (let i = 0; i < 4; i++) {
        const [xs, ys] = src[i], [xd, yd] = dst[i];
        A.push([xs, ys, 1, 0, 0, 0, -xs * xd, -ys * xd]);
        b.push(xd);
        A.push([0, 0, 0, xs, ys, 1, -xs * yd, -ys * yd]);
        b.push(yd);
    }
    const h = solve8x8(A, b);
    if (!h) return null;
    return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

export function perspectiveTransform(srcCanvas, corners) {
    const outSize = computeOutputSize(corners);
    const dstW = outSize.width, dstH = outSize.height;

    // Deteksi jika landscape, kita akan putar 90 derajat secara otomatis
    const needsAutoRotate = dstW > dstH;

    const dstCorners = [[0, 0], [dstW - 1, 0], [dstW - 1, dstH - 1], [0, dstH - 1]];
    const H = computeHomography(dstCorners, corners);
    if (!H) throw new Error('Gagal menghitung homografi');

    const srcCtx = srcCanvas.getContext('2d');
    const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height).data;
    const srcW = srcCanvas.width, srcH = srcCanvas.height;

    const rawOutCanvas = document.createElement('canvas');
    rawOutCanvas.width = dstW;
    rawOutCanvas.height = dstH;
    const rawOutCtx = rawOutCanvas.getContext('2d');
    const outImg = rawOutCtx.createImageData(dstW, dstH);
    const out = outImg.data;

    for (let y = 0; y < dstH; y++) {
        const wy = H[7] * y + H[8];
        const ax = H[1] * y + H[2];
        const bx = H[4] * y + H[5];

        for (let x = 0; x < dstW; x++) {
            const w = H[6] * x + wy;
            if (Math.abs(w) < 1e-10) continue;
            const invW = 1 / w;
            const sx = (H[0] * x + ax) * invW;
            const sy = (H[3] * x + bx) * invW;

            const x0 = sx | 0, y0 = sy | 0;
            const x1 = x0 + 1, y1 = y0 + 1;
            if (x0 < 0 || x1 >= srcW || y0 < 0 || y1 >= srcH) continue;

            const fx = sx - x0, fy = sy - y0;
            const fx1 = 1 - fx, fy1 = 1 - fy;

            const i00 = (y0 * srcW + x0) << 2;
            const i10 = (y0 * srcW + x1) << 2;
            const i01 = (y1 * srcW + x0) << 2;
            const i11 = (y1 * srcW + x1) << 2;
            const oi = (y * dstW + x) << 2;

            for (let c = 0; c < 4; c++) {
                out[oi + c] = (srcData[i00 + c] * fx1 * fy1 +
                               srcData[i10 + c] * fx * fy1 +
                               srcData[i01 + c] * fx1 * fy +
                               srcData[i11 + c] * fx * fy + 0.5) | 0;
            }
        }
    }

    rawOutCtx.putImageData(outImg, 0, 0);

    // Smart Auto-Rotation
    if (needsAutoRotate) {
        const rotCanvas = document.createElement('canvas');
        rotCanvas.width = dstH;
        rotCanvas.height = dstW;
        const rotCtx = rotCanvas.getContext('2d');
        rotCtx.translate(dstH / 2, dstW / 2);
        rotCtx.rotate(90 * Math.PI / 180);
        rotCtx.drawImage(rawOutCanvas, -dstW / 2, -dstH / 2);
        return rotCanvas;
    }

    return rawOutCanvas;
}

export function applyCanvasEffects(srcCanvas, dstCanvas, brightness, contrast, bwMode, grayMode, threshold, enhanceMode = false, rotation = 0) {
    // Terapkan rotasi manual terlebih dahulu
    let rotCanvas = srcCanvas;
    if (rotation !== 0) {
        rotCanvas = document.createElement('canvas');
        const isSideways = rotation === 90 || rotation === 270;
        rotCanvas.width = isSideways ? srcCanvas.height : srcCanvas.width;
        rotCanvas.height = isSideways ? srcCanvas.width : srcCanvas.height;
        const rCtx = rotCanvas.getContext('2d');
        rCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
        rCtx.rotate((rotation * Math.PI) / 180);
        rCtx.drawImage(srcCanvas, -srcCanvas.width / 2, -srcCanvas.height / 2);
    }

    const w = rotCanvas.width, h = rotCanvas.height;
    if (dstCanvas.width !== w || dstCanvas.height !== h) {
        dstCanvas.width = w;
        dstCanvas.height = h;
    }

    const hasOpenCV = typeof cv !== 'undefined' && cv.Mat;

    // Jika OpenCV dimuat, kita bisa jalankan efek lanjutan (Enhance & B&W)
    if (hasOpenCV && (bwMode || enhanceMode)) {
        let src, enhanced, adjusted, bwMat, gray;
        try {
            src = cv.imread(rotCanvas);
            let finalMat = src;

            // 1. Unsharp Masking (Auto Enhance)
            if (enhanceMode) {
                enhanced = new cv.Mat();
                let blurred = new cv.Mat();
                cv.GaussianBlur(src, blurred, new cv.Size(0, 0), 3);
                cv.addWeighted(src, 1.5, blurred, -0.5, 0, enhanced);
                blurred.delete();
                finalMat = enhanced;
            }

            // 2. Brightness & Contrast (Alpha & Beta)
            if (brightness !== 0 || contrast !== 0 || enhanceMode) {
                adjusted = new cv.Mat();
                const alpha = (259 * (contrast + 255)) / (255 * (259 - contrast));
                const beta = brightness * 2.55;
                finalMat.convertTo(adjusted, -1, alpha, beta);
                finalMat = adjusted;
            }

            // 3. B&W Adaptive Thresholding
            if (bwMode) {
                bwMat = new cv.Mat();
                gray = new cv.Mat();
                cv.cvtColor(finalMat, gray, cv.COLOR_RGBA2GRAY, 0);
                const blockSize = 31;
                const C = ((threshold - 128) / 128) * 15 + 15;
                cv.adaptiveThreshold(gray, bwMat, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, blockSize, C);
                finalMat = bwMat;
            } else if (grayMode) {
                bwMat = new cv.Mat();
                cv.cvtColor(finalMat, bwMat, cv.COLOR_RGBA2GRAY, 0);
                finalMat = bwMat;
            }

            cv.imshow(dstCanvas, finalMat);
            return; // Berhasil, keluar dari fungsi
        } catch (e) {
            console.error("OpenCV Effects gagal, menggunakan fallback:", e);
        } finally {
            // Cleanup memori secara aman
            if (src && !src.isDeleted()) src.delete();
            if (enhanced && !enhanced.isDeleted()) enhanced.delete();
            if (adjusted && !adjusted.isDeleted()) adjusted.delete();
            if (bwMat && !bwMat.isDeleted()) bwMat.delete();
            if (gray && !gray.isDeleted()) gray.delete();
        }
    }

    // --- FALLBACK (Manual Loop) ---
    const ctx = dstCanvas.getContext('2d');
    ctx.drawImage(rotCanvas, 0, 0);
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    const bFactor = brightness * 2.55;
    const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < d.length; i += 4) {
        let r = d[i], g = d[i + 1], b = d[i + 2];

        r += bFactor; g += bFactor; b += bFactor;

        r = cFactor * (r - 128) + 128;
        g = cFactor * (g - 128) + 128;
        b = cFactor * (b - 128) + 128;

        if (grayMode) {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = g = b = gray;
        }

        // Fallback Global Thresholding jika OpenCV gagal atau tidak ada
        if (bwMode) {
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            const val = lum > threshold ? 255 : 0;
            r = g = b = val;
        }

        d[i] = Math.max(0, Math.min(255, r));
        d[i + 1] = Math.max(0, Math.min(255, g));
        d[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(imgData, 0, 0);
}
