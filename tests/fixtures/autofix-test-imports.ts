// Test file for import auto-fixes
import { unused1, used } from 'module1';
import { unused2 } from 'module2';
import type { UnusedType } from 'types';

const value = used;
export { value };