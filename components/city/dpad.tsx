"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import type { CityPoint } from "@/lib/city-layout";
export default function DirectionPad({
  onMove,
}: {
  onMove: (point: CityPoint) => void;
}) {
  const pointer = useRef<number | null>(null);
  const move = useRef(onMove);
  move.current = onMove;
  const [offset, setOffset] = useState<CityPoint>({ x: 0, z: 0 });

  function release() {
    pointer.current = null;
    setOffset({ x: 0, z: 0 });
    move.current({ x: 0, z: 0 });
  }

  function steer(event: PointerEvent<HTMLDivElement>) {
    if (pointer.current !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left - bounds.width / 2;
    const z = event.clientY - bounds.top - bounds.height / 2;
    const radius = bounds.width * 0.3;
    const distance = Math.hypot(x, z);
    const divisor = Math.max(radius, distance);
    setOffset({ x: x / divisor * radius, z: z / divisor * radius });
    move.current(distance < 5 ? { x: 0, z: 0 } : { x: x / divisor, z: z / divisor });
  }

  useEffect(() => {
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("blur", release);
      move.current({ x: 0, z: 0 });
    };
  }, []);

  return (
    <>
    <div
      className="city-thumbstick"
      role="group"
      aria-label="Touch joystick. Drag to move."
      onPointerDown={(event) => {
        if (pointer.current !== null || event.button !== 0) return;
        pointer.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        steer(event);
      }}
      onPointerMove={steer}
      onPointerUp={(event) => { if (pointer.current === event.pointerId) release(); }}
      onPointerCancel={(event) => { if (pointer.current === event.pointerId) release(); }}
      onLostPointerCapture={(event) => { if (pointer.current === event.pointerId) release(); }}
    >
      <span aria-hidden="true" style={{ transform: `translate(${offset.x}px, ${offset.z}px)` }} />
      <small aria-hidden="true">MOVE</small>
    </div>
    <div className="city-dpad" role="group" aria-label="Move the citizen">
      {[
        { name: "north", x: 0, z: -1, Icon: ArrowUp },
        { name: "west", x: -1, z: 0, Icon: ArrowLeft },
        { name: "south", x: 0, z: 1, Icon: ArrowDown },
        { name: "east", x: 1, z: 0, Icon: ArrowRight },
      ].map(({ name, x, z, Icon }) => (
        <button
          type="button"
          key={name}
          className={`pad-${name}`}
          aria-label={`Move ${name}`}
          onPointerDown={(event) => {
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            onMove({ x, z });
          }}
          onPointerUp={() => onMove({ x: 0, z: 0 })}
          onPointerCancel={() => onMove({ x: 0, z: 0 })}
          onLostPointerCapture={() => onMove({ x: 0, z: 0 })}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onMove({ x, z });
            }
          }}
          onKeyUp={() => onMove({ x: 0, z: 0 })}
          onBlur={() => onMove({ x: 0, z: 0 })}
        >
          <Icon size={17} />
        </button>
      ))}
    </div>
    </>
  );
}
