import { expect } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

const fallbackUiExpectTimeoutMs = 10000;
const configuredUiExpectTimeoutMs = Number(process.env.UI_EXPECT_TIMEOUT_MS ?? fallbackUiExpectTimeoutMs);

export const defaultUiExpectTimeoutMs = Number.isFinite(configuredUiExpectTimeoutMs)
  ? configuredUiExpectTimeoutMs
  : fallbackUiExpectTimeoutMs;

export const uiExpect = expect.configure({
  timeout: defaultUiExpectTimeoutMs
});
