import { PiSunFill, PiMoonFill } from 'react-icons/pi';
import { useTheme } from '../hooks/useTheme';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      className={`control h-9 w-9 ${className}`}
    >
      {isLight ? <PiMoonFill /> : <PiSunFill />}
    </button>
  );
};

export default ThemeToggle;
