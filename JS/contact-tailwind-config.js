// This file configures Tailwind only when the Tailwind CDN/global object exists.
// The guard prevents errors on pages where Tailwind is not loaded.
if (window.tailwind) {
tailwind.config = {
  // darkMode:"class" means dark styling is controlled by a class on <html>,
  // usually <html class="dark">.
  darkMode:"class",
  theme:{ extend:{
    // colors adds project-specific names so HTML can use classes like
    // text-on-surface, bg-surface, and text-soft-teal.
    colors:{
      "surface-container-lowest":"#0e0e0f","on-primary":"#283041","on-tertiary-container":"#92725f",
      "primary":"#bec6dc","on-error":"#690005","on-secondary":"#213145","on-surface":"#e4e2e3",
      "background":"#131315","surface-bright":"#39393a","surface":"#131315",
      "on-primary-fixed":"#131c2b","on-primary-container":"#71798c","surface-variant":"#353436",
      "secondary-container":"#3a4a5f","on-secondary-fixed":"#0b1c30","tertiary-fixed":"#ffdcc7",
      "primary-fixed-dim":"#bec6dc","on-secondary-container":"#a9bad3","outline":"#8f9097",
      "secondary":"#b7c8e1","outline-variant":"#45474c","primary-fixed":"#dbe2f8",
      "on-tertiary":"#422b1c","on-primary-fixed-variant":"#3f4758","error-container":"#93000a",
      "tertiary":"#e5bfa9","inverse-surface":"#e4e2e3","surface-container-highest":"#353436",
      "surface-container-low":"#1b1b1d","on-surface-variant":"#c6c6cd","on-background":"#e4e2e3",
      "inverse-primary":"#565e71","tertiary-container":"#140500","surface-tint":"#bec6dc",
      "secondary-fixed-dim":"#b7c8e1","surface-dim":"#131315","secondary-fixed":"#d3e4fe",
      "on-secondary-fixed-variant":"#38485d","error":"#ffb4ab","on-tertiary-fixed":"#2b1709",
      "inverse-on-surface":"#303032","surface-container":"#1f1f21","on-error-container":"#ffdad6",
      "surface-container-high":"#2a2a2b","tertiary-fixed-dim":"#e5bfa9",
      "on-tertiary-fixed-variant":"#5b4130","primary-container":"#020817","soft-teal":"#2DD4BF"
    },
    // borderRadius defines reusable rounding tokens for cards, buttons, and pills.
    borderRadius:{"DEFAULT":"0.25rem","lg":"0.5rem","xl":"0.75rem","full":"9999px"},

    // spacing defines custom spacing names used in the contact layout.
    spacing:{"sidebar-width":"280px","gutter":"24px","container-padding-mobile":"20px","container-padding-desktop":"40px","base":"8px"},

    // fontFamily maps semantic names to the loaded Google Fonts.
    fontFamily:{"body-md":["Inter"],"label-sm":["Inter"],"headline-lg":["Manrope"],"body-lg":["Inter"],"label-md":["Inter"],"headline-md":["Manrope"],"headline-xl":["Manrope"],"body-sm":["Inter"]},

    // fontSize defines semantic text styles as [size, options].
    // options include lineHeight, fontWeight, and letterSpacing.
    fontSize:{
      "body-md":["16px",{"lineHeight":"1.6","fontWeight":"400"}],
      "label-sm":["12px",{"lineHeight":"1.2","fontWeight":"500"}],
      "headline-lg":["32px",{"lineHeight":"1.3","letterSpacing":"-0.01em","fontWeight":"600"}],
      "headline-lg-mobile":["28px",{"lineHeight":"1.2","letterSpacing":"-0.01em","fontWeight":"700"}],
      "body-lg":["18px",{"lineHeight":"1.6","fontWeight":"400"}],
      "label-md":["14px",{"lineHeight":"1.2","letterSpacing":"0.05em","fontWeight":"600"}],
      "headline-md":["24px",{"lineHeight":"1.4","fontWeight":"600"}],
      "headline-xl":["40px",{"lineHeight":"1.2","letterSpacing":"-0.02em","fontWeight":"700"}],
      "body-sm":["14px",{"lineHeight":"1.5","fontWeight":"400"}]
    }
  }}
}
}
