import { mediaWidthTemplates } from '../constants'
import { Theme } from '../interfaces'

const darkTheme: Theme = {
    colors: {
        primary: '#fafafa',
        secondary: '#c3c5cb',
        gradient: 'linear-gradient(225deg, #78D8FF 0%, #4CE096 100%)',
        neutral: '#191b1f',
        background: '#191b1f',
        overlay: 'rgba(0, 0, 0, 0.8)',
        border: '#2c2f36',
        foreground: '#212429',
        dangerColor: '#ff495a',
        dangerBackground: '#F8D7DA',
        dangerBorder: '#F5C6CB',
        alertColor: '#004085',
        alertBackground: '#CCE5FF',
        alertBorder: '#B8DAFF',
        successColor: '#155724',
        successBackground: '#D4EDDA',
        successBorder: '#C3E6CB',
        warningColor: '#856404',
        warningBackground: '#FFF3CD',
        warningBorder: '#856404',
        dimmedColor: '#ffffff',
        dimmedBackground: '#A4ABB7',
        dimmedBorder: '#878787',
        placeholder: '#212429',
        inputBorderColor: '#6fbcdb',
        boxShadow: '#323232',
    },
    font: {
        extraSmall: '12px',
        small: '14px',
        default: '16px',
        medium: '18px',
        large: '20px',
        extraLarge: '22px',
    },
    global: {
        gridMaxWidth: '1454px',
        borderRadius: '4px',
        extraCurvedRadius: '20px',
        buttonPadding: '8px 16px',
        modalWidth: '720px',
    },
    mediaWidth: mediaWidthTemplates,
}

export { darkTheme }
