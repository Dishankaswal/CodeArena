import { createClient } from '@supabase/supabase-js'
import supabaseConfig from '../supbase.config.js'

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey)
