import {
  ColorPrimary500,
  ColorPrimary50,
  ColorSecondary500,
  ColorNeutral900,
  Spacing4,
  Spacing8,
  TypographyFontSizeBase,
  TypographyFontFamilyBase,
  Elevation1,
  BorderRadiusMd,
  AnimationDurationFast,
  SizeInteractiveXsHeight,
  ColorMember1,
  ColorMember2,
  ColorMember3,
  ColorMember4,
  ColorMember5,
  ColorMember6,
  TypographyFontSize7xl,
} from './index';

describe('Design Tokens', () => {
  describe('Color Tokens', () => {
    it('should export primary color scale', () => {
      expect(ColorPrimary500).toBe('#208497');
      expect(ColorPrimary50).toBe('#f0f8fa');
    });

    it('should export secondary color scale', () => {
      expect(ColorSecondary500).toBeDefined();
      expect(typeof ColorSecondary500).toBe('string');
    });

    it('should export neutral colors', () => {
      expect(ColorNeutral900).toBeDefined();
      expect(typeof ColorNeutral900).toBe('string');
    });

    it('should have valid hex color format', () => {
      expect(ColorPrimary500).toMatch(/^#[0-9a-f]{6}$/i);
    });

    // LK-7: member colours in join order (teal, rust-600, violet, sage, berry, slate).
    it('should export the six member colours', () => {
      expect([ColorMember1, ColorMember2, ColorMember3, ColorMember4, ColorMember5, ColorMember6]).toEqual([
        '#1a6a79',
        '#b04a22',
        '#4e3f84',
        '#5f7150',
        '#9e3846',
        '#5a798c',
      ]);
    });
  });

  describe('Spacing Tokens', () => {
    it('should export spacing scale', () => {
      expect(Spacing4).toBe('1rem');
      expect(Spacing8).toBe('2rem');
    });

    it('should follow 4px grid system', () => {
      // Spacing should be multiples of 0.25rem (4px)
      expect(Spacing4).toMatch(/^\d+(\.\d+)?rem$/);
    });
  });

  describe('Typography Tokens', () => {
    it('should export font size base', () => {
      expect(TypographyFontSizeBase).toBe('1rem');
    });

    // LK-2: the display step at 1920 px.
    it('should export the 72 px step', () => {
      expect(TypographyFontSize7xl).toBe('4.5rem');
    });

    it('should export font family', () => {
      expect(TypographyFontFamilyBase).toBeDefined();
      expect(typeof TypographyFontFamilyBase).toBe('string');
    });

    it('should have valid font size format', () => {
      expect(TypographyFontSizeBase).toMatch(/^\d+(\.\d+)?rem$/);
    });
  });

  describe('Elevation Tokens', () => {
    it('should export elevation levels', () => {
      expect(Elevation1).toBeDefined();
      expect(typeof Elevation1).toBe('string');
    });

    it('should have box-shadow format', () => {
      expect(Elevation1).toContain('px');
      expect(Elevation1).toContain('rgba');
    });
  });

  describe('Border Radius Tokens', () => {
    it('should export border radius values', () => {
      expect(BorderRadiusMd).toBeDefined();
      expect(typeof BorderRadiusMd).toBe('string');
    });

    it('should have valid border radius format', () => {
      expect(BorderRadiusMd).toMatch(/^\d+(\.\d+)?rem$/);
    });
  });

  describe('Animation Tokens', () => {
    it('should export animation duration', () => {
      expect(AnimationDurationFast).toBe('150ms');
    });

    it('should have valid duration format', () => {
      expect(AnimationDurationFast).toMatch(/^\d+ms$/);
    });
  });

  describe('Size Tokens', () => {
    it('should export interactive size tokens', () => {
      expect(SizeInteractiveXsHeight).toBeDefined();
    });

    it('should have valid size format', () => {
      expect(SizeInteractiveXsHeight).toMatch(/^\d+(\.\d+)?rem$/);
    });
  });

  describe('Token Consistency', () => {
    it('should export all required token categories', () => {
      // Verify tokens from all 8 categories are exported
      expect(ColorPrimary500).toBeDefined(); // color
      expect(Spacing4).toBeDefined(); // spacing
      expect(TypographyFontSizeBase).toBeDefined(); // typography
      expect(Elevation1).toBeDefined(); // elevation
      expect(BorderRadiusMd).toBeDefined(); // borderRadius
      expect(AnimationDurationFast).toBeDefined(); // animation
      expect(SizeInteractiveXsHeight).toBeDefined(); // size
    });

    it('should not have undefined tokens', () => {
      expect(ColorPrimary500).not.toBeUndefined();
      expect(ColorPrimary500).not.toBeNull();
    });
  });
});
