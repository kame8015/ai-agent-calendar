import { Mastra } from '@mastra/core';
import { calendarAgent } from './agents/calendarAgent';

export const mastra = new Mastra({
  agents: { calendarAgent },
});
