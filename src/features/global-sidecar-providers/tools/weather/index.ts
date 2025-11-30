import { tool } from 'ai';
import { z } from 'zod';

export const weatherTool = tool({
  description: '获取指定城市的天气信息',
  inputSchema: z.object({
    city: z.string().describe('要查询天气的城市名称'),
    unit: z
      .enum(['C', 'F'])
      .describe('温度单位，C表示摄氏度，F表示华氏度')
      .default('C')
      .optional(),
  }),
  execute: async ({ city, unit = 'C' }: {
    city: string;
    unit?: 'C' | 'F';
  }): Promise<string> => {
    const callId = `weather_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[weather] [${callId}] execute 开始，city: ${city}, unit: ${unit}`);
    
    
    console.log(`🌤️ [Weather Tool] 查询城市: ${city}, 单位: ${unit}`);
    
    const weatherData: Record<string, { value: number; description: string }> = {
      '北京': { value: 15, description: '晴' },
      '上海': { value: 20, description: '多云' },
      '广州': { value: 25, description: '阴' },
      '深圳': { value: 26, description: '晴' },
      '杭州': { value: 18, description: '小雨' },
      'Paris': { value: 18, description: 'Sunny' },
      'New York': { value: 22, description: 'Cloudy' },
      'London': { value: 15, description: 'Rainy' },
    };

    const weather = weatherData[city] || { value: 20, description: '晴' };
    
    const temp = unit === 'F' ? Math.round(weather.value * 9/5 + 32) : weather.value;

    const result = `${city}当前天气：${weather.description}，温度 ${temp}°${unit}`;
    
    console.log(`[weather] [${callId}] execute 完成，结果:`, result);
    
    return result;
  },
});

