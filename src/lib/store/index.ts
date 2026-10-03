import "server-only";
import { localStoreAllowed, supabaseConfigured } from "@/lib/env";
import { localStore } from "./local";
import { staticStore } from "./static";
import { supabaseStore } from "./supabase";
import type { Store } from "./types";

// Source des données :
// - Supabase si configuré (production) ;
// - sinon, en développement uniquement, le magasin JSON local (.data/dev-store.json) ;
// - sinon les données statiques de src/data (lecture seule).
export function getStore(): Store {
  if (supabaseConfigured()) return supabaseStore;
  if (localStoreAllowed()) return localStore;
  return staticStore;
}

export * from "./types";
