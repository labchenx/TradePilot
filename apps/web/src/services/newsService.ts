import { mockAiSummary, mockNews } from '@/data';

export const newsService = {
  listNews() {
    // TODO: Replace with backend news aggregation endpoint in a later stage.
    return mockNews;
  },
  getAiSummary() {
    // TODO: Replace with backend-only AI summary endpoint in a later stage.
    return mockAiSummary;
  },
};

