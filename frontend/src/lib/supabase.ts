const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
// หลังจากกลับมาที่แอป
const session = await supabase.auth.getSession();
localStorage.setItem('token', session.data.session?.access_token);