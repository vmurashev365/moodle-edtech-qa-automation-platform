import { expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { readIntegerEnv } from './env-values';

dotenv.config();

export const defaultUiExpectTimeoutMs = readIntegerEnv(process.env, 'UI_EXPECT_TIMEOUT_MS', { min: 1 }) ?? 10000;

export const uiExpect = expect.configure({
  timeout: defaultUiExpectTimeoutMs
});
