describe('@smartodo/supabase path alias', () => {
  it('resolves supabase package correctly', async () => {
    const supabase = await import('@smartodo/supabase');
    expect(supabase).toBeDefined();
  });
});
