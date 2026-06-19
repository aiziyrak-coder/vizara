import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          ar?: boolean;
          'ar-modes'?: string;
          'ar-scale'?: string;
          'ar-placement'?: string;
          'camera-controls'?: boolean;
          'touch-action'?: string;
          alt?: string;
          loading?: string;
          reveal?: string;
          'shadow-intensity'?: string;
          'shadow-softness'?: string;
          exposure?: string;
          'environment-image'?: string;
          'skybox-image'?: string;
          'tone-mapping'?: string;
          'interaction-prompt'?: string;
          crossorigin?: string;
          poster?: string;
        },
        HTMLElement
      >;
    }
  }
}
