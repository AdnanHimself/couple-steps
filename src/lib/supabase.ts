import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://euxxkcirxjedcsfiqxxt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1eHhrY2lyeGplZGNzZmlxeHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0ODAwMDUsImV4cCI6MjA3OTA1NjAwNX0.4AboNJ3-R4dW9X35Wu9yEwE5x-hq--Ic_O90FvBALVE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
