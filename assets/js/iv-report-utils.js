// =================================================================
// IV REPORT UTILITIES – network metrics for intervisibility reports
// =================================================================
(function(global) {
    'use strict';

    /**
     * Build adjacency structure from visible pairs.
     * @param {number} n - Number of nodes (sites).
     * @param {Array<{i: number, j: number}|{indexA: number, indexB: number}>} pairs - Visible pairs as index pairs.
     * @returns {Object} Adjacency: nodeIndex -> { neighborIndex: 1, ... }
     */
    function buildAdjacencyFromVisiblePairs(n, pairs) {
        const adj = {};
        for (let i = 0; i < n; i++) adj[i] = {};
        (pairs || []).forEach(function(p) {
            const a = p.i !== undefined ? p.i : p.indexA;
            const b = p.j !== undefined ? p.j : p.indexB;
            if (a >= 0 && a < n && b >= 0 && b < n && a !== b) {
                adj[a][b] = 1;
                adj[b][a] = 1;
            }
        });
        return adj;
    }

    /**
     * BFS from source, return distances to all reachable nodes.
     */
    function bfsDistances(adj, source) {
        const n = Object.keys(adj).length;
        const dist = {};
        for (let i = 0; i < n; i++) dist[i] = -1;
        dist[source] = 0;
        const queue = [source];
        let head = 0;
        while (head < queue.length) {
            const u = queue[head++];
            const neighbors = Object.keys(adj[u]).filter(function(k) { return adj[u][k] === 1; });
            for (let i = 0; i < neighbors.length; i++) {
                const v = parseInt(neighbors[i], 10);
                if (dist[v] === -1) {
                    dist[v] = dist[u] + 1;
                    queue.push(v);
                }
            }
        }
        return dist;
    }

    /**
     * Count connected components using BFS.
     */
    function countComponents(adj) {
        const n = Object.keys(adj).length;
        const visited = {};
        let count = 0;
        for (let i = 0; i < n; i++) {
            if (visited[i]) continue;
            count++;
            const queue = [i];
            visited[i] = true;
            let head = 0;
            while (head < queue.length) {
                const u = queue[head++];
                const neighbors = Object.keys(adj[u]).filter(function(k) { return adj[u][k] === 1; });
                for (let j = 0; j < neighbors.length; j++) {
                    const v = parseInt(neighbors[j], 10);
                    if (!visited[v]) {
                        visited[v] = true;
                        queue.push(v);
                    }
                }
            }
        }
        return count;
    }

    /**
     * Graph diameter (max shortest-path distance between any two nodes in the same component).
     * Returns null if graph is disconnected.
     */
    function getDiameter(adj) {
        const n = Object.keys(adj).length;
        let maxDist = 0;
        for (let s = 0; s < n; s++) {
            const dist = bfsDistances(adj, s);
            for (let t = 0; t < n; t++) {
                if (dist[t] >= 0 && dist[t] > maxDist) maxDist = dist[t];
            }
        }
        return maxDist === 0 && n > 1 ? null : maxDist;
    }

    /**
     * Average path length (over all pairs in the same component; each component weighted by its pairs).
     */
    function getAveragePathLength(adj) {
        const n = Object.keys(adj).length;
        let totalDist = 0;
        let totalPairs = 0;
        for (let s = 0; s < n; s++) {
            const dist = bfsDistances(adj, s);
            for (let t = s + 1; t < n; t++) {
                if (dist[t] >= 0) {
                    totalDist += dist[t];
                    totalPairs++;
                }
            }
        }
        return totalPairs > 0 ? totalDist / totalPairs : 0;
    }

    /**
     * Betweenness centrality: fraction of shortest paths that pass through each node.
     * Simplified: we count shortest paths between all pairs and how many go through each node.
     */
    function betweennessCentrality(adj) {
        const n = Object.keys(adj).length;
        const bc = {};
        for (let i = 0; i < n; i++) bc[i] = 0;

        for (let s = 0; s < n; s++) {
            for (let t = s + 1; t < n; t++) {
                const paths = shortestPathsBetween(adj, s, t);
                if (paths.length === 0) continue;
                const through = {};
                paths.forEach(function(path) {
                    for (let k = 1; k < path.length - 1; k++) {
                        through[path[k]] = (through[path[k]] || 0) + 1;
                    }
                });
                Object.keys(through).forEach(function(v) {
                    bc[parseInt(v, 10)] += through[v] / paths.length;
                });
            }
        }
        return bc;
    }

    /**
     * Enumerate all shortest paths from s to t (BFS then collect paths).
     */
    function shortestPathsBetween(adj, s, t) {
        const dist = bfsDistances(adj, s);
        if (dist[t] < 0) return [];
        const n = Object.keys(adj).length;
        const pred = {};
        for (let i = 0; i < n; i++) pred[i] = [];
        const queue = [s];
        let head = 0;
        while (head < queue.length) {
            const u = queue[head++];
            if (dist[u] >= dist[t]) continue;
            const neighbors = Object.keys(adj[u]).filter(function(k) { return adj[u][k] === 1; });
            for (let i = 0; i < neighbors.length; i++) {
                const v = parseInt(neighbors[i], 10);
                if (dist[v] === dist[u] + 1) {
                    pred[v].push(u);
                    if (queue.indexOf(v) === -1) queue.push(v);
                }
            }
        }
        const paths = [];
        function collect(path, cur) {
            if (cur === s) {
                path.push(s);
                paths.push(path.slice().reverse());
                path.pop();
                return;
            }
            path.push(cur);
            (pred[cur] || []).forEach(function(p) { collect(path, p); });
            path.pop();
        }
        collect([], t);
        return paths;
    }

    /**
     * Closeness centrality: 1 / (average distance to all other reachable nodes). 0 if unreachable.
     */
    function closenessCentrality(adj) {
        const n = Object.keys(adj).length;
        const cc = {};
        for (let i = 0; i < n; i++) {
            const dist = bfsDistances(adj, i);
            let sum = 0;
            let count = 0;
            for (let j = 0; j < n; j++) {
                if (i !== j && dist[j] >= 0) {
                    sum += dist[j];
                    count++;
                }
            }
            cc[i] = count > 0 ? 1 / (sum / count) : 0;
        }
        return cc;
    }

    global.IVReportUtils = {
        buildAdjacencyFromVisiblePairs: buildAdjacencyFromVisiblePairs,
        countComponents: countComponents,
        getDiameter: getDiameter,
        getAveragePathLength: getAveragePathLength,
        betweennessCentrality: betweennessCentrality,
        closenessCentrality: closenessCentrality
    };
})(typeof window !== 'undefined' ? window : this);
