import { useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';

interface HanziStrokeProps {
  character: string;
}

const HanziStroke = ({ character }: HanziStrokeProps) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (targetRef.current && character) {
      const writer = HanziWriter.create(targetRef.current, character, {
        width: 200,
        height: 200,
        padding: 5,
        strokeAnimationSpeed: 1, 
        delayBetweenStrokes: 200,
      });
      writer.animateCharacter();
    }
  }, [character]);

  return <div ref={targetRef} />;
};

export default HanziStroke;
