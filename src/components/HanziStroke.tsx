import { useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';

interface HanziStrokeProps {
  character: string;
}

const HanziStroke = ({ character }: HanziStrokeProps) => {
  const targetRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);

  useEffect(() => {
    if (targetRef.current) {
      writerRef.current = HanziWriter.create(targetRef.current, character, {
        width: 100,
        height: 100,
        padding: 5,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 200,
      });

      writerRef.current.animateCharacter();
    }

    return () => {
      if (writerRef.current) {
        writerRef.current.target.remove();
        writerRef.current = null;
      }
    };
  }, [character]);

  return <div ref={targetRef} />;
};

export default HanziStroke;
