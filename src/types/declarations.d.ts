declare module 'lucide-react-native' {
    import { SvgProps } from 'react-native-svg';
    import { ComponentType } from 'react';

    export interface IconProps extends SvgProps {
        size?: number | string;
        absoluteStrokeWidth?: boolean;
        color?: string;
    }

    export type Icon = ComponentType<IconProps>;

    export const Heart: Icon;
    export const MessageCircle: Icon;
    export const User: Icon;
    export const LayoutDashboard: Icon;
    export const BarChart3: Icon;
    export const ArrowLeft: Icon;
    export const Footprints: Icon;
    export const X: Icon;
    // Add other icons as needed
}
