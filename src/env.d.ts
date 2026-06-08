/// <reference types="astro/client" />

import type { EstadoAsociado, EstadoContribucion } from './lib/fmpi/types';
import type { UserData } from './lib/auth';

declare global {
  namespace App {
    interface Locals {
      user: UserData | null;
      /** FMPI membership status — set by middleware via asociados lookup. */
      estado: EstadoAsociado | null;
      /** FMPI contribution status — set by middleware via asociados lookup. */
      estadoContribucion: EstadoContribucion | null;
    }
  }
}

interface ImportMetaEnv {
  readonly DEEPSEEK_API_KEY: string;
  readonly APPWRITE_ENDPOINT: string;
  readonly APPWRITE_PROJECT_ID: string;
  readonly APPWRITE_API_KEY: string;
  /** Appwrite Database ID for the FMPI database. */
  readonly APPWRITE_DATABASE_ID: string;
  /** Comma-separated Appwrite user $id values with admin role. Optional. */
  readonly ADMIN_USER_IDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
