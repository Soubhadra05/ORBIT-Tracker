import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_PUBLIC_SUPABASE_URL
const key = import.meta.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const supabase = url && key ? createClient(url, key) : null
export const cloudReady = !!supabase