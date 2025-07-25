const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zgykreisfsvggjszgoic.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpneWtyZWlzZnN2Z2dqc3pnb2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzcyMTMsImV4cCI6MjA2Njk1MzIxM30.JM4dokypddXO5s3kDaiX_WIikO2xsKSFB-Ha7QU5StI';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
