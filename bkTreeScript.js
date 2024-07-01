class BKTree {
    constructor() {
        this.root = null;
    }

    insert(word) {
        if (!this.root) {
            this.root = new BKNode(word);
        } else {
            this.root.insert(word);
        }
    }

    search(word, maxDistance) {
        const results = [];
        if (this.root) {
            this.root.search(word, maxDistance, results);
        }
        return results;
    }

    remove(word) {
        if (this.root) {
            this.root.remove(word);
        }
    }

    draw(highlightedWord = null) {
        const svg = d3.select("#tree");
        svg.selectAll("*").remove();

        if (this.root) {
            const margin = { top: 40, right: 120, bottom: 20, left: 120 };
            const width = window.innerWidth - margin.left - margin.right;
            const height = window.innerHeight - margin.top - margin.bottom;

            const data = this._buildTreeData(this.root, 0);
            const root = d3.hierarchy(data);
            const treeLayout = d3.tree().nodeSize([100, 150]);
            treeLayout(root);

            const g = svg.append("g")
                .attr("transform", `translate(${width / 2},${margin.top})`);

            const zoom = d3.zoom()
                .scaleExtent([0.1, 4])
                .on("zoom", (event) => {
                    g.attr("transform", event.transform);
                });

            svg.call(zoom);

            // Inicializa el gráfico centrado
            const initialTransform = d3.zoomIdentity.translate(width / 2, margin.top);
            svg.call(zoom.transform, initialTransform);

            const links = g.selectAll(".link")
                .data(root.links())
                .enter();

            links.append("line")
                .attr("class", "link")
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.source.x)
                .attr("y2", d => d.source.y)
                .style("stroke", "#000")
                .transition()
                .duration(d => d.target.data.word === highlightedWord ? 500 : 0)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            links.append("text")
                .attr("class", "link-label")
                .attr("x", d => {
                    if (d.target.x > d.source.x) {
                        return (d.source.x + d.target.x) / 2 + 10;
                    } else {
                        return (d.source.x + d.target.x) / 2 - 10;
                    }
                })
                .attr("y", d => (d.source.y + d.target.y) / 2)
                .attr("text-anchor", "middle")
                .text(d => d.target.data.distance)
                .style("opacity", 0)
                .transition()
                .delay(d => d.target.data.word === highlightedWord ? 500 : 0)
                .duration(d => d.target.data.word === highlightedWord ? 500 : 0)
                .style("opacity", 1);

            const node = g.selectAll(".node")
                .data(root.descendants())
                .enter()
                .append("g")
                .attr("class", "node")
                .attr("transform", d => `translate(${d.x}, ${d.y})`);

            node.append("circle")
                .attr("r", 30)
                .style("fill", d => {
                    if (d.data.deleted) {
                        return "lightcoral";
                    } else if (d.data.word === highlightedWord) {
                        return "yellow";
                    } else {
                        return "#fff";
                    }
                })
                .style("stroke", "#000")
                .style("opacity", 0)
                .transition()
                .delay(d => d.data.word === highlightedWord ? 500 : 0)
                .duration(d => d.data.word === highlightedWord ? 500 : 0)
                .style("opacity", 1)
                .attr("r", 30);

            node.append("text")
                .attr("dy", 5)
                .attr("text-anchor", "middle")
                .text(d => d.data.word)
                .style("opacity", 0)
                .transition()
                .delay(d => d.data.word === highlightedWord ? 500 : 0)
                .duration(d => d.data.word === highlightedWord ? 500 : 0)
                .style("opacity", 1);
        }
    }

    _buildTreeData(node, distance) {
        var children = [];
        for (const dist in node.children) {
            children.push(this._buildTreeData(node.children[dist], parseInt(dist)));
        }
        return { word: node.word, distance: distance, children: children, deleted: node.deleted };
    }
}

class BKNode {
    constructor(word) {
        this.word = word;
        this.children = {};
        this.deleted = false;
    }

    insert(word) {
        var distance = this._levenshteinDistance(word, this.word);
        if (distance == 0) {
            if (this.deleted == true)
                this.deleted = false; // Reactivate the node if it was marked as deleted
            return;
        }
        if (this.children[distance]) {
            this.children[distance].insert(word);
        } else {
            this.children[distance] = new BKNode(word);
        }
    }

    search(word, maxDistance, results) {
        var distance = this._levenshteinDistance(word, this.word);
        if (distance <= maxDistance && !this.deleted) {
            results.push({ word: this.word, distance: distance });
        }
        for (let i = Math.max(1, distance - maxDistance); i <= distance + maxDistance; i++) {
            if (this.children[i]) {
                this.children[i].search(word, maxDistance, results);
            }
        }
    }

    remove(word) {
        const distance = this._levenshteinDistance(word, this.word);
        if (distance == 0) {
            this.deleted = true;
            return;
        }
        if (this.children[distance]) {
            this.children[distance].remove(word);
        }
    }

    _levenshteinDistance(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) == a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, //Reemplazo
                        matrix[i][j - 1] + 1, //Inserción
                        matrix[i - 1][j] + 1 //Eliminación
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }
}

const tree = new BKTree();

window.onload = () => {
    var elementSvg = document.getElementById("tree");
    elementSvg.setAttribute("width", window.innerWidth - 20);
    elementSvg.setAttribute("height", window.innerHeight - 170);
}

document.getElementById('addButton').addEventListener('click', () => {
    var word = document.getElementById('wordInput').value.trim();
    if (word) {
        tree.insert(word);
        tree.draw(word); // Resaltar el nodo recién añadido
        document.getElementById('wordInput').value = '';
    }
});

document.getElementById('searchButton').addEventListener('click', () => {
    var word = document.getElementById('searchInput').value.trim();
    var dim = document.getElementById('distanciaMaxima').value.trim();
    var results = tree.search(word, parseInt(dim));
    var resultArea = document.getElementById('searchResults');
    var resltLabel = document.getElementById('labelChange');
    resltLabel.textContent = `Resultados para "${word}" con distancia maxima de ${dim}`;
    resultArea.value = results.map(r => `${r.word} (distancia: ${r.distance})`).join('\n');
    document.getElementById('searchInput').value = '';
    document.getElementById('distanciaMaxima').value = '';
});

document.getElementById('removeButton').addEventListener('click', () => {
    var word = document.getElementById('removeInput').value.trim();
    if (word) {
        tree.remove(word);
        tree.draw();
        document.getElementById('removeInput').value = '';
    }
});