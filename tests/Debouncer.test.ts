import { Debouncer } from "../src/utils/Debouncer";

describe("Debouncer", () => {
  let debouncer: Debouncer;
  let mockFn: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    debouncer = new Debouncer(200);
    mockFn = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should debounce function calls", () => {
    // Call the debounced function multiple times
    debouncer.debounce(mockFn);
    debouncer.debounce(mockFn);
    debouncer.debounce(mockFn);

    // Function should not be called immediately
    expect(mockFn).not.toHaveBeenCalled();

    // Fast-forward time
    jest.advanceTimersByTime(200);

    // Function should be called only once
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("should cancel pending debounced calls", () => {
    debouncer.debounce(mockFn);
    debouncer.cancel();

    jest.advanceTimersByTime(200);
    expect(mockFn).not.toHaveBeenCalled();
  });
});
