import * as windowExtensions from './window';
import { initializeUx } from './ux/initialize';
(window as any).extensions = windowExtensions;
initializeUx();