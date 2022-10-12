import React from "react";
import styled from "styled-components";

const SecondaryCursor = styled.div`
  z-index: 1000;
  border-radius: 50%;
  pointer-events: none;
  overflow: hidden;
  transform: translate3d(0, 0, 0);
  position: fixed;
  background: white;
  // border: 1px solid black;
  opacity: 0.5;
  //mix-blend-mode: difference;
  transition: width 0.25s ease-in-out, height 0.25s ease-in-out;
  width: 30px;
  height: 30px;
  filter: drop-shadow(1px 2px 8px cyan);
  &.regular {
    width: 40px;
    height: 40px;
  }
  &.small {
    width: 60px;
    height: 60px;
  }
`;

const CustomCursor = () => {
  const secondaryCursor = React.useRef(null);
  const positionRef = React.useRef({
    mouseX: 0,
    mouseY: 0,
    destinationX: 0,
    destinationY: 0,
    distanceX: 0,
    distanceY: 0,
    key: -1,
  });

  React.useEffect(() => {
    document.addEventListener("mousemove", (event) => {
      const { clientX, clientY } = event;

      const mouseX = clientX;
      const mouseY = clientY;

      positionRef.current.mouseX =
        mouseX - secondaryCursor.current.clientWidth / 2;
      positionRef.current.mouseY =
        mouseY - secondaryCursor.current.clientHeight / 2;
    });

    return () => {};
  }, []);

  React.useEffect(() => {
    const followMouse = () => {
      positionRef.current.key = requestAnimationFrame(followMouse);
      const {
        mouseX,
        mouseY,
        destinationX,
        destinationY,
        distanceX,
        distanceY,
      } = positionRef.current;
      if (!destinationX || !destinationY) {
        positionRef.current.destinationX = mouseX;
        positionRef.current.destinationY = mouseY;
      } else {
        positionRef.current.distanceX = (mouseX - destinationX) * 0.4;
        positionRef.current.distanceY = (mouseY - destinationY) * 0.4;
        if (
          Math.abs(positionRef.current.distanceX) +
            Math.abs(positionRef.current.distanceY) <
          0.1
        ) {
          positionRef.current.destinationX = mouseX;
          positionRef.current.destinationY = mouseY;
        } else {
          positionRef.current.destinationX += distanceX;
          positionRef.current.destinationY += distanceY;
        }
      }
      if (secondaryCursor && secondaryCursor.current)
        secondaryCursor.current.style.transform = `translate3d(${destinationX}px, ${destinationY}px, 0)`;
    };
    followMouse();
  }, []);
  return (
    <div>
      <SecondaryCursor ref={secondaryCursor}></SecondaryCursor>
    </div>
  );
};

export default CustomCursor;
