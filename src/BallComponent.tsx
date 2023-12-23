
import { count } from 'console';
import React, { useState, useEffect, useRef } from 'react';
import { start } from 'repl';

interface BallState {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    radius: number;
}

interface PegState {
    position: { x: number; y: number };
    radius: number;
}

interface Line {
    start: { x: number, y: number };
    end: { x: number, y: number };
}
const walls: Line[] = [
    
  ];
const starting = 50;
const gravity = 0.05;
const friction = 0.9919;
const pegSpace = 40;
const ballRadius = 10;
const rows = 8;
const counters = Array(rows+1).fill(0);


const BallComponent: React.FC = () => {
    const [balls, setBalls] = useState<BallState[]>([]);
    const [numberOfBalls, setNumberOfBalls] = useState(1); // New state variable for user input
    
    const [pegs, setPegs] = useState<PegState[]>([]);
    const pegsRef = useRef(pegs);

    function calculateNormal(line: Line) {
        const dx = line.end.x - line.start.x;
        const dy = line.end.y - line.start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        // Rotate the line 90 degrees and normalize
        return { x: -dy / length, y: dx / length };
    }

    function checkLineCollision(ball: BallState, line: Line) {
        // Find the vector from the start to the end of the line
        const lineVec = {
            x: line.end.x - line.start.x,
            y: line.end.y - line.start.y
        };
    
        // Find the vector from the start of the line to the ball
        const toBallVec = {
            x: ball.position.x - line.start.x,
            y: ball.position.y - line.start.y
        };
    
        // Project toBallVec onto lineVec
        const lineLength = Math.sqrt(lineVec.x * lineVec.x + lineVec.y * lineVec.y);
        const lineUnitVec = { x: lineVec.x / lineLength, y: lineVec.y / lineLength };
        const projectionLength = (toBallVec.x * lineUnitVec.x + toBallVec.y * lineUnitVec.y);
        const nearestPointOnLine = {
            x: line.start.x + lineUnitVec.x * projectionLength,
            y: line.start.y + lineUnitVec.y * projectionLength
        };
    
        // Ensure the nearest point is within the line segment
        if (projectionLength < 0 || projectionLength > lineLength) {
            return false;
        }
    
        // Check if the distance from the ball to the nearest point is less than the radius
        const distToLine = Math.sqrt(
            (ball.position.x - nearestPointOnLine.x) ** 2 + 
            (ball.position.y - nearestPointOnLine.y) ** 2
        );
    
        if (distToLine < ball.radius) {
            const normal = calculateNormal(line);
            return { collision: true, normal };
        }
    
        return { collision: false };
    }

    useEffect(() => {
        pegsRef.current = pegs;
      }, [pegs]);

    const addPeg = () => {
        const newPeg: PegState = {
            position: { x: 100 + pegSpace*pegs.length, y: 200 }, // Example starting position
            radius: 5,
        };
        setPegs((pegs) => [...pegs, newPeg]);
    };

    const makeBoard = (rows: number, pegSpace: number) => {
        let pegsArray: PegState[] = [];
        let startY = 200;
        let slotLength = rows*pegSpace-100;
        for (let i = 0; i < rows; i++) {
            // For each row, calculate the horizontal start position
            let offsetX = (window.innerWidth - pegSpace * i) / 2;
    
            for (let j = 0; j <= i; j++) {
                const newPeg: PegState = {
                    position: { 
                        x: offsetX + j * pegSpace, 
                        y: startY + i * pegSpace 
                    },
                    radius: 5,
                };
                pegsArray.push(newPeg);
                if (i === rows - 1) {
                    //add sort lines
                    walls.push({start: {x: offsetX + j * pegSpace, y: startY + i * pegSpace + 5}, end: {x: offsetX + j * pegSpace, y: slotLength+startY + i * pegSpace}});

                }
            }
        }

        // Add walls
        //left
        walls.push({start: {x: window.innerWidth/2 - pegSpace, y: startY}, end: {x: window.innerWidth/2 - pegSpace, y: -window.innerHeight}});
        //right
        walls.push({start: {x: window.innerWidth/2 + pegSpace, y: startY}, end: {x: window.innerWidth/2 + pegSpace, y: -window.innerHeight}});
        //left diagonal
        walls.push({start: {x: window.innerWidth/2 - pegSpace, y: startY}, end: {x: window.innerWidth/2 - pegSpace*(1+(rows-1)/2), y: startY + pegSpace*(rows-1)}});
        //right diagonal
        walls.push({start: {x: window.innerWidth/2 + pegSpace, y: startY}, end: {x: window.innerWidth/2 + pegSpace*(1+(rows-1)/2), y: startY + pegSpace*(rows-1)}});
        //bottom left
        walls.push({start: {x: window.innerWidth/2 - pegSpace*(1+(rows-1)/2), y: startY + pegSpace*(rows-1)}, end: {x: window.innerWidth/2 - pegSpace*(1+(rows-1)/2), y: startY + pegSpace*(rows-1)+slotLength}});
        //bottom right
        walls.push({start: {x: window.innerWidth/2 + pegSpace*(1+(rows-1)/2), y: startY + pegSpace*(rows-1)}, end: {x: window.innerWidth/2 + pegSpace*(1+(rows-1)/2), y: startY + pegSpace*(rows-1)+slotLength}});
        //bottom
        walls.push({start: {x: window.innerWidth/2 - pegSpace*(1+(rows-1)/2), y: startY + pegSpace*(rows-1)+slotLength}, end: {x: window.innerWidth/2 + pegSpace*(1+(rows-1)/2), y: startY + pegSpace*(rows-1)+slotLength}});
        setPegs(pegsArray);
    };

    const addBall = () => {
        let newBalls: BallState[] = [];
        for (let i = 0; i < numberOfBalls; i++) {
            const randomNumber = (Math.random() * 2) - 1;
            const newBall: BallState = {
                position: { x: (randomNumber * 5) + (window.innerWidth / 2), y: starting },
                velocity: { x: 0, y: 0},
                radius: ballRadius,
            };
            newBalls.push(newBall);
        }
        setBalls(balls => [...balls, ...newBalls]);
    };

    const updateBallPositions = () => {
        setBalls((balls) =>
          balls
            .map((ball) => {
              // Update velocity
            let collided: boolean = false;
              
              let newPos = {
                x: ball.position.x + ball.velocity.x,
                y: ball.position.y + ball.velocity.y,
              };
      
              // Collision detection with window boundaries
              let newVel = { ...ball.velocity };
              if (newPos.x + ball.radius > window.innerWidth || newPos.x - ball.radius < 0) {
                newVel.x = -newVel.x;
              }
              if (newPos.y + ball.radius > window.innerHeight || newPos.y - ball.radius < 0) {
                newVel.y = -newVel.y * friction;
              }

              if (newPos.y > starting+pegSpace*rows*2) {
                let pegIndex = Math.floor((newPos.x - (window.innerWidth/2 - pegSpace*(1+(rows-1)/2)))/pegSpace);
                console.log(pegIndex);
                counters[pegIndex]++;
              }
             // if(Math.abs(ball.velocity.y) < .1){
               //     newVel.y = 0;
              //}
    
              // Collision detection with pegs
              walls.forEach((wall) => {
                const collisionResult = checkLineCollision({ ...ball, position: newPos }, wall);
                if (collisionResult && collisionResult.collision) {
                    const { normal } = collisionResult;
                    
                    // Reflect the velocity using the collision normal
                    const dot = normal ? 2 * (ball.velocity.x * -normal.x + ball.velocity.y * -normal.y) : 0;
                    if (normal) {
                        newVel.x = ball.velocity.x - dot * -normal.x;
                    }
                    if (normal) {
                        newVel.y = ball.velocity.y - dot * -normal.y;
                        collided = true;
                    }
                }
            });
              pegsRef.current.forEach((peg) => {
                
                    const dx = newPos.x - peg.position.x;
                    const dy = newPos.y - peg.position.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
            
                    if (distance < ball.radius + peg.radius) {
                        
                        // Calculate normal vector
                        const normalX = dx / distance;
                        const normalY = dy / distance;
            
                        // Reflect velocity across the normal vector
                        const dotProduct = ball.velocity.x * normalX + ball.velocity.y * normalY;
                        newVel.x = ball.velocity.x - 2 * dotProduct * normalX;
                        newVel.y = ball.velocity.y - 2 * dotProduct * normalY;
            
            
                        // Adjust ball position to be outside the peg's radius
                        const overlap = (ball.radius + peg.radius) - distance;
                        newPos.x += overlap * normalX;
                        newPos.y += overlap * normalY;
                        collided = true;
                    
                    }
                    if(!collided){
                        newVel.y += gravity;
                    }
                    newVel.y *= friction;
                    newVel.x *= friction;
              });
      
              return { ...ball, position: newPos, velocity: newVel };
            })
            .filter((b) => b.position.y < window.innerHeight) // Filter out balls below window
            .filter((b) => b.position.y < (starting+pegSpace*rows*2))
            
        );
      };
      
    useEffect(() => {
        const timer = setInterval(() => {
            updateBallPositions();
        }, 2); // Update positions every 20ms

        return () => {
            clearInterval(timer);
        };
    }, []);

    return (
        <div style={{ width: '100%', height: '100vh' }}>
             <input
                type="number"
                value={numberOfBalls}
                onChange={(e) => setNumberOfBalls(Number(e.target.value))}
            />
            <button onClick={addBall}>Add Ball</button>
            <button onClick={() => makeBoard(rows, pegSpace)}>Add Peg</button>
            <p>Number of balls: {balls.length}</p>
            <p>Number of pegs: {pegs.length}</p>
            <svg width="100%" height="100%" style={{ overflow: 'auto' }}>
                {balls.map((ball, index) => (
                    <circle key={index} cx={ball.position.x} cy={ball.position.y} r={ball.radius} fill="blue" />
                ))}
                {pegs.map((peg, index) => (
                    <circle key={index} cx={peg.position.x} cy={peg.position.y} r={peg.radius} fill="red" />
                ))}
                 {walls.map((line, index) => (
                    <line
                    key={index}
                    x1={line.start.x}
                    y1={line.start.y}
                    x2={line.end.x}
                    y2={line.end.y}
                    stroke="black" />
                ))}
                {counters.map((counter, index) => (
                <text 
                    key={index} 
                    x={window.innerWidth / 2 - pegSpace * (1 + (rows - 1) / 2) + index * pegSpace} 
                    y={200 + rows * pegSpace + 30} // Adjust this value as needed
                    fill="black"
                    fontSize="12px"
                >
                    {counter/2}
                </text>
                ))}
            </svg>
        </div>
    );
};

export default BallComponent;
  