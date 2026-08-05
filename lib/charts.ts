export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

export function parseChartCommand(text: string): ChartData | null {
  if (text.toLowerCase().includes("chart") || text.toLowerCase().includes("metrics") || text.toLowerCase().includes("graph")) {
    return {
      labels: ["Q1 Active", "Q2 Peak", "Q3 Target", "Q4 Forecast"],
      datasets: [
        {
          label: "Server CPU Load (%)",
          data: [42, 68, 55, 80],
          backgroundColor: ["rgba(59, 130, 246, 0.5)"],
          borderColor: ["#3b82f6"],
        },
        {
          label: "Memory Usage (%)",
          data: [50, 62, 59, 74],
          backgroundColor: ["rgba(16, 185, 129, 0.5)"],
          borderColor: ["#10b981"],
        }
      ]
    };
  }
  return null;
}