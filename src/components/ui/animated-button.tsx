import React from 'react';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  loadingText?: string;
  isLoading?: boolean;
}

export function AnimatedButton({ text, loadingText, isLoading, ...props }: AnimatedButtonProps) {
  return (
    <button className="animated-button" disabled={isLoading} {...props}>
      <div className="bg"></div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 342 208"
        height="160"
        width="260"
        className="splash"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="3"
          d="M54.1054 99.7837C54.1054 99.7837 40.0984 90.7874 26.6893 97.6362C13.2802 104.485 1.5 97.6362 1.5 97.6362"
        ></path>
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="3"
          d="M285.273 99.7841C285.273 99.7841 299.28 90.7879 312.689 97.6367C326.098 104.486 340.105 95.4893 340.105 95.4893"
        ></path>
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="3"
          strokeOpacity="0.3"
          d="M281.133 64.9917C281.133 64.9917 287.96 49.8089 302.934 48.2295C317.908 46.6501 319.712 36.5272 319.712 36.5272"
        ></path>
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="3"
          strokeOpacity="0.3"
          d="M281.133 138.984C281.133 138.984 287.96 154.167 302.934 155.746C317.908 157.326 319.712 167.449 319.712 167.449"
        ></path>
      </svg>

      <div className="wrap">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 221 42"
          height="42"
          width="221"
          className="path"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="3"
            d="M182.674 2H203C211.837 2 219 9.16344 219 18V24C219 32.8366 211.837 40 203 40H18C9.16345 40 2 32.8366 2 24V18C2 9.16344 9.16344 2 18 2H47.8855"
          ></path>
        </svg>

        <div className="outline"></div>
        <div className="content">
          <span className="char state-1">
            {(isLoading ? loadingText || text : text).split('').map((char, i) => (
              <span 
                key={i} 
                data-label={char} 
                style={{ '--i': i + 1 } as React.CSSProperties}
                className="font-semibold tracking-wide"
              >
                {char}
              </span>
            ))}
          </span>
          <div className="icon">
            <div></div>
          </div>
        </div>
      </div>
    </button>
  );
}