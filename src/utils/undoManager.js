const MAX_HISTORY = 20;

export const createUndoManager = (initialState) => {
  let history = [JSON.parse(JSON.stringify(initialState || {}))];
  let currentIndex = 0;

  const getState = () => ({
    current: history[currentIndex],
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
  });

  const pushState = (newState) => {
    history = history.slice(0, currentIndex + 1);
    history.push(JSON.parse(JSON.stringify(newState)));
    if (history.length > MAX_HISTORY) history.shift();
    else currentIndex++;
    return getState();
  };

  const undo = () => { if (currentIndex > 0) currentIndex--; return getState(); };
  const redo = () => { if (currentIndex < history.length - 1) currentIndex++; return getState(); };
  const reset = (s) => { history = [JSON.parse(JSON.stringify(s || {}))]; currentIndex = 0; };

  return { getState, pushState, undo, redo, reset };
};
export default createUndoManager;
