export const passwordPatterns = {
  middleStrength: new RegExp(
    '^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9])(?=.*[a-z].*[a-z].*[a-z]).{8,}$',
  ),
};

export const colorPatterns = {
  hexColor: new RegExp(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  rgbColor: new RegExp(/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/),
};
