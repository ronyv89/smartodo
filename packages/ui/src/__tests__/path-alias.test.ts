describe('@smartodo/ui path alias', () => {
  it('resolves ui package correctly', async () => {
    const ui = await import('@smartodo/ui');
    expect(ui).toBeDefined();
  });
});
