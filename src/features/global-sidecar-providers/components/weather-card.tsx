import { Cloud, Sun, CloudRain, CloudSnow, Wind } from "lucide-react";

interface WeatherCardProps {
  city: string;
  description: string;
  temperature: number;
  unit?: "C" | "F";
}

const getWeatherIcon = (description: string) => {
  const desc = description.toLowerCase();
  if (desc.includes("晴") || desc.includes("sunny")) {
    return <Sun className="h-8 w-8 text-yellow-500" />;
  }
  if (desc.includes("云") || desc.includes("cloud")) {
    return <Cloud className="h-8 w-8 text-gray-400" />;
  }
  if (desc.includes("雨") || desc.includes("rain")) {
    return <CloudRain className="h-8 w-8 text-blue-400" />;
  }
  if (desc.includes("雪") || desc.includes("snow")) {
    return <CloudSnow className="h-8 w-8 text-blue-300" />;
  }
  return <Wind className="h-8 w-8 text-gray-400" />;
};

export const WeatherCard = ({ city, description, temperature, unit = "C" }: WeatherCardProps) => {
  return (
    <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-foreground">{city}</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">{getWeatherIcon(description)}</div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {temperature}°{unit}
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">{description}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

