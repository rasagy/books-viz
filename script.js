document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });

                // Optional: Update active class on nav links
                navLinks.forEach(navLink => navLink.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // Function to fetch JSON data
    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Could not fetch data:", error);
            return null; // Or handle error appropriately
        }
    }

    // Chart Configurations
    const defaultChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#333',
                    font: {
                        size: 14,
                        family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                    }
                }
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0,0,0,0.7)',
                titleColor: '#fff',
                bodyColor: '#fff',
                titleFont: {
                    size: 14,
                    weight: 'bold',
                    family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                },
                bodyFont: {
                    size: 12,
                    family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                },
                padding: 10,
                cornerRadius: 4,
                displayColors: true,
                borderColor: 'rgba(0,0,0,0.1)',
                borderWidth: 1
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#555',
                    font: {
                        size: 12,
                        family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                    }
                },
                grid: {
                    color: '#e0e0e0', // Softer grid lines
                    drawOnChartArea: false // Only draw grid lines for y-axis usually
                }
            },
            y: {
                ticks: {
                    color: '#555',
                    font: {
                        size: 12,
                        family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                    },
                    // beginAtZero: true // Common for bar charts
                },
                grid: {
                    color: '#e0e0e0' // Softer grid lines
                }
            }
        },
        animation: {
            duration: 800, // general animation time
            easing: 'easeInOutQuart' // Easing function for animations
        }
    };

    // 1. Most-Reviewed Books by Each Genre (Grouped Bar Chart)
    async function renderMostReviewedChart() {
        const data = await fetchData('data/most_reviewed_by_genre.json');
        if (!data) return;

        const ctx = document.getElementById('mostReviewedChart').getContext('2d');

        // Process data for grouped bar chart: group by genre, then list books
        // For simplicity, if the JSON is structured with one main book per genre:
        const genres = [...new Set(data.map(item => item.genre))];
        const bookTitles = data.map(item => item.title); // Assuming one top book per genre in this simplified version
        const reviews = data.map(item => item.reviews);

        // More complex grouping (if multiple books per genre in one chart)
        // This example assumes one book shown per genre for simplicity
        // For a true grouped bar, you'd have multiple datasets, one for each book if comparing side-by-side within a genre.
        // Or, if it's top book *per* genre, then a simple bar chart is fine.
        // The prompt says "Most-Reviewed Books by Each Genre" -> this implies one bar per genre representing its most reviewed book.

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => `${item.title} (${item.genre})`), // Combine title and genre for clarity
                datasets: [{
                    label: 'Number of Reviews',
                    data: data.map(item => item.reviews),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                ...defaultChartOptions,
                indexAxis: 'y', // Horizontal bar chart for better readability of long labels
                scales: {
                    ...defaultChartOptions.scales,
                    y: {
                        ...defaultChartOptions.scales.y,
                        ticks: {
                            ...defaultChartOptions.scales.y.ticks,
                             autoSkip: false // Ensure all labels are shown
                        }
                    },
                    x: {
                         ...defaultChartOptions.scales.x,
                        ticks: {
                            ...defaultChartOptions.scales.x.ticks,
                            callback: function(value) {
                                return value >= 1000 ? (value / 1000) + 'k' : value; // Format large numbers
                            }
                        },
                        title: {
                            display: true,
                            text: 'Number of Reviews',
                            color: '#333',
                            font: { size: 14, weight: 'bold'}
                        }
                    }
                },
                plugins: {
                    ...defaultChartOptions.plugins,
                    legend: { display: false }, // No need for legend with one dataset
                    tooltip: {
                        ...defaultChartOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.x !== null) {
                                    label += context.parsed.x.toLocaleString();
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // 2. Top-Rated vs. Most-Rated Books (Two side-by-side horizontal bar charts)
    async function renderTopRatedChart() {
        const data = await fetchData('data/top_rated_books.json');
        if (!data) return;

        const ctx = document.getElementById('topRatedChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(book => book.title),
                datasets: [{
                    label: 'Average Rating',
                    data: data.map(book => book.rating),
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                ...defaultChartOptions,
                indexAxis: 'y',
                 scales: {
                    ...defaultChartOptions.scales,
                    x: {
                        ...defaultChartOptions.scales.x,
                        title: {
                            display: true,
                            text: 'Average Rating (out of 5)',
                            color: '#333',
                            font: { size: 14, weight: 'bold'}
                        },
                        min: Math.min(...data.map(b => b.rating)) > 4 ? 4 : 0, // Adjust min for rating scale
                        max: 5
                    }
                },
                plugins: { ...defaultChartOptions.plugins, legend: { display: false } }
            }
        });
    }

    async function renderMostRatedChart() {
        const data = await fetchData('data/most_rated_books.json');
        if (!data) return;

        const ctx = document.getElementById('mostRatedChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(book => book.title),
                datasets: [{
                    label: 'Total Ratings',
                    data: data.map(book => book.totalratings),
                    backgroundColor: 'rgba(255, 159, 64, 0.7)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                ...defaultChartOptions,
                indexAxis: 'y',
                scales: {
                    ...defaultChartOptions.scales,
                    x: {
                        ...defaultChartOptions.scales.x,
                        title: {
                            display: true,
                            text: 'Total Number of Ratings',
                            color: '#333',
                            font: { size: 14, weight: 'bold'}
                        },
                        ticks: {
                             ...defaultChartOptions.scales.x.ticks,
                            callback: function(value) {
                                return value >= 1000000 ? (value / 1000000) + 'M' : (value >= 1000 ? (value/1000) + 'k' : value);
                            }
                        }
                    }
                },
                plugins: { ...defaultChartOptions.plugins, legend: { display: false } }
            }
        });
    }

    // 3. Genre Popularity vs. Ratings (Scatter Plot)
    async function renderGenrePopularityChart() {
        const data = await fetchData('data/genre_vs_rating.json');
        if (!data) return;

        const ctx = document.getElementById('genrePopularityChart').getContext('2d');

        // Prepare data for scatter plot
        const scatterData = data.map(item => ({
            x: item.popularity, // Popularity (e.g., total ratings in genre)
            y: item.avg_rating, // Average rating
            genre: item.genre   // To show in tooltip
        }));

        // Assign colors based on genre or use a predefined list
        const genreColors = {};
        const uniqueGenres = [...new Set(data.map(item => item.genre))];
        const backgroundColors = [
            'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
            'rgba(199, 199, 199, 0.7)', 'rgba(83, 102, 255, 0.7)', 'rgba(102, 255, 83, 0.7)'
        ];
        uniqueGenres.forEach((genre, index) => {
            genreColors[genre] = backgroundColors[index % backgroundColors.length];
        });

        new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Genre', // This will be overridden by tooltip callback
                    data: scatterData,
                    backgroundColor: scatterData.map(d => genreColors[d.genre] || 'rgba(201, 203, 207, 0.7)'),
                    borderColor: scatterData.map(d => (genreColors[d.genre] || 'rgba(201, 203, 207, 1)').replace('0.7', '1')),
                    borderWidth: 1,
                    pointRadius: 8, // Make points larger
                    pointHoverRadius: 12
                }]
            },
            options: {
                ...defaultChartOptions,
                scales: {
                    x: {
                        ...defaultChartOptions.scales.x,
                        type: 'linear', // Ensure linear scale for scatter
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Popularity (e.g., Total Ratings in Genre)',
                            color: '#333',
                            font: { size: 14, weight: 'bold'}
                        },
                        ticks: {
                             ...defaultChartOptions.scales.x.ticks,
                            callback: function(value) {
                                return value >= 1000 ? (value / 1000) + 'k' : value;
                            }
                        }
                    },
                    y: {
                        ...defaultChartOptions.scales.y,
                        title: {
                            display: true,
                            text: 'Average Rating',
                            color: '#333',
                            font: { size: 14, weight: 'bold'}
                        },
                        min: Math.min(...scatterData.map(d => d.y)) > 3 ? 3 : 0, // Adjust min for rating scale
                        max: 5
                    }
                },
                plugins: {
                    ...defaultChartOptions.plugins,
                    legend: { display: false }, // No global legend, info in tooltip
                    tooltip: {
                        ...defaultChartOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                const item = context.raw;
                                return `${item.genre}: Pop. ${item.x.toLocaleString()}, Rating ${item.y}`;
                            }
                        }
                    }
                }
            }
        });
    }

    // 4. Hidden Gems: High Rating, Low Visibility (Lollipop/Scatter Plot)
    async function renderHiddenGemsChart() {
        const data = await fetchData('data/hidden_gems.json');
        if (!data) return;

        const ctx = document.getElementById('hiddenGemsChart').getContext('2d');

        // For a lollipop effect with a standard scatter plot, we can try to draw lines manually
        // or use a scatter plot and emphasize the meaning of axes.
        // A true lollipop might need a custom chart type or plugin.
        // Let's use a scatter plot and style it to suggest the "low visibility" (x-axis) vs "high rating" (y-axis).

        const scatterData = data.map(item => ({
            x: item.totalratings, // Low visibility (fewer ratings)
            y: item.rating,       // High rating
            title: item.title
        }));

        new Chart(ctx, {
            type: 'scatter', // Using scatter, could customize to look more like lollipop
            data: {
                datasets: [{
                    label: 'Hidden Gem',
                    data: scatterData,
                    backgroundColor: 'rgba(153, 102, 255, 0.7)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1,
                    pointRadius: 6,
                    pointHoverRadius: 10,
                }]
            },
            options: {
                ...defaultChartOptions,
                scales: {
                    x: {
                        ...defaultChartOptions.scales.x,
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Total Number of Ratings (Visibility)',
                            color: '#333',
                            font: { size: 14, weight: 'bold'}
                        },
                        ticks: {
                            ...defaultChartOptions.scales.x.ticks,
                           callback: function(value) {
                               return value.toLocaleString(); // Format numbers
                           }
                       }
                    },
                    y: {
                        ...defaultChartOptions.scales.y,
                        title: {
                            display: true,
                            text: 'Average Rating',
                            color: '#333',
                            font: { size: 14, weight: 'bold'}
                        },
                        min: Math.min(...scatterData.map(d => d.y)) > 4 ? 4 : 3, // Focus on high ratings
                        max: 5
                    }
                },
                plugins: {
                    ...defaultChartOptions.plugins,
                    legend: { display: false },
                    tooltip: {
                        ...defaultChartOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                const item = context.raw;
                                return `${item.title}: Rating ${item.y}, Reviews ${item.x.toLocaleString()}`;
                            }
                        }
                    }
                }
                // To attempt a lollipop look:
                // One could add a plugin that draws a line from each point to the y-axis (or a baseline).
                // This is advanced for Chart.js out-of-the-box.
                // For now, a scatter plot with clear axis labels will convey the meaning.
            }
        });
    }

    // Initialize all charts
    renderMostReviewedChart();
    renderTopRatedChart();
    renderMostRatedChart();
    renderGenrePopularityChart();
    renderHiddenGemsChart();

});

// Helper for lollipop chart (if implemented via plugin or custom drawing)
// This is a placeholder for a more complex lollipop implementation if needed.
// For now, the scatter plot for "Hidden Gems" will be used.
Chart.register({
    id: 'lollipopLine',
    afterDraw: (chart) => {
        if (chart.config.type === 'scatter' && chart.canvas.id === 'hiddenGemsChart') { // Only for hidden gems chart
            const ctx = chart.ctx;
            chart.data.datasets.forEach((dataset, i) => {
                const meta = chart.getDatasetMeta(i);
                if (!meta.hidden) {
                    meta.data.forEach((element, index) => {
                        const dataPoint = dataset.data[index];
                        const { x, y } = element.getProps(['x', 'y'], true);

                        // Draw line from y-axis (or a baseline) to the point
                        // For lollipop, usually line is vertical if x is categorical, or horizontal if y is categorical
                        // Here, both are numerical. We want to emphasize the rating (y) for a given visibility (x)
                        // A line from the x-axis up to the point.
                        const xScale = chart.scales.x;
                        const yScale = chart.scales.y;

                        ctx.beginPath();
                        ctx.strokeStyle = dataset.borderColor || 'rgba(153, 102, 255, 0.5)'; // Line color
                        ctx.lineWidth = 2;
                        ctx.moveTo(x, yScale.getPixelForValue(yScale.min)); // Start from bottom of y-axis for this point's x
                        ctx.lineTo(x, y); // Line to the point
                        ctx.stroke();
                    });
                }
            });
        }
    }
});
