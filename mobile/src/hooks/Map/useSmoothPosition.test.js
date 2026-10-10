import { act, renderHook } from "@testing-library/react-native";

import { useMotionStore } from "@/store/useMotionStore";
import { useSmoothPosition } from "./useSmoothPosition";

const A = [44.8, 20.45];
const NORTH = [44.801, 20.45];
const EAST = [44.801, 20.452];

beforeEach(() => {
  jest.useFakeTimers();
  useMotionStore.setState({ preference: "full", systemReduced: false });
});

afterEach(() => {
  jest.useRealTimers();
});

it("glides to a new fix instead of jumping, then lands on it", async () => {
  const { result, rerender } = await renderHook(({ target }) => useSmoothPosition(target), { initialProps: { target: A } });
  expect(result.current.position).toEqual(A);
  expect(result.current.rotation).toBeNull();

  await rerender({ target: NORTH });
  await act(async () => {
    jest.advanceTimersByTime(400);
  });
  const midway = result.current.position[0];
  expect(midway).toBeGreaterThan(A[0]);
  expect(midway).toBeLessThan(NORTH[0]);

  await act(async () => {
    jest.advanceTimersByTime(2000);
  });
  expect(result.current.position).toEqual(NORTH);
  expect(Math.round(result.current.rotation)).toBe(0);
});

it("turns towards each new heading the short way", async () => {
  const { result, rerender } = await renderHook(({ target }) => useSmoothPosition(target), { initialProps: { target: A } });
  await rerender({ target: NORTH });
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
  await rerender({ target: EAST });
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
  expect(Math.round(result.current.rotation)).toBe(90);
});

it("jumps straight there when the rider prefers reduced motion", async () => {
  useMotionStore.setState({ preference: "reduced" });
  const { result, rerender } = await renderHook(({ target }) => useSmoothPosition(target), { initialProps: { target: A } });
  await rerender({ target: NORTH });
  expect(result.current.position).toEqual(NORTH);
});

it("jumps across a gap too long to be a ride", async () => {
  const { result, rerender } = await renderHook(({ target }) => useSmoothPosition(target), { initialProps: { target: A } });
  await rerender({ target: [44.9, 20.45] });
  expect(result.current.position).toEqual([44.9, 20.45]);
});
