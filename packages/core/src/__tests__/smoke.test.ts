describe('Jest infrastructure smoke test', () => {
  it('true equals true', () => {
    expect(true).toBe(true);
  });

  it('@testing-library/jest-dom is loaded', () => {
    // jest-dom extends expect — verify the setup file ran
    const div = document.createElement('div');
    document.body.appendChild(div);
    expect(div).toBeInTheDocument();
    document.body.removeChild(div);
  });
});
