/**
 * Web colors in GLSL
 */
export const glsl_web_colors = /* glsl */ `
  // #F0F8FF
  #define aliceblue vec3(240.0 / 255.0, 248.0 / 255.0, 255.0 / 255.0) 
  // #FAEBD7
  #define antiquewhite vec3(250.0 / 255.0, 235.0 / 255.0, 215.0 / 255.0) 
  // #00FFFF
  #define aqua vec3(0.0 / 255.0, 255.0 / 255.0, 255.0 / 255.0) 
  // #7FFFD4
  #define aquamarine vec3(127.0 / 255.0, 255.0 / 255.0, 212.0 / 255.0) 
  // #F0FFFF
  #define azure vec3(240.0 / 255.0, 255.0 / 255.0, 255.0 / 255.0) 
  // #F5F5DC
  #define beige vec3(245.0 / 255.0, 245.0 / 255.0, 220.0 / 255.0) 
  // #FFE4C4
  #define bisque vec3(255.0 / 255.0, 228.0 / 255.0, 196.0 / 255.0) 
  // #000000
  #define black vec3(0.0 / 255.0, 0.0 / 255.0, 0.0 / 255.0) 
  // #FFEBCD
  #define blanchedalmond vec3(255.0 / 255.0, 235.0 / 255.0, 205.0 / 255.0) 
  // #0000FF
  #define blue vec3(0.0 / 255.0, 0.0 / 255.0, 255.0 / 255.0) 
  // #8A2BE2
  #define blueviolet vec3(138.0 / 255.0, 43.0 / 255.0, 226.0 / 255.0) 
  // #A52A2A
  #define brown vec3(165.0 / 255.0, 42.0 / 255.0, 42.0 / 255.0) 
  // #DEB887
  #define burlywood vec3(222.0 / 255.0, 184.0 / 255.0, 135.0 / 255.0) 
  // #5F9EA0
  #define cadetblue vec3(95.0 / 255.0, 158.0 / 255.0, 160.0 / 255.0) 
  // #7FFF00
  #define chartreuse vec3(127.0 / 255.0, 255.0 / 255.0, 0.0 / 255.0) 
  // #D2691E
  #define chocolate vec3(210.0 / 255.0, 105.0 / 255.0, 30.0 / 255.0) 
  // #FF7F50
  #define coral vec3(255.0 / 255.0, 127.0 / 255.0, 80.0 / 255.0) 
  // #6495ED
  #define cornflowerblue vec3(100.0 / 255.0, 149.0 / 255.0, 237.0 / 255.0) 
  // #FFF8DC
  #define cornsilk vec3(255.0 / 255.0, 248.0 / 255.0, 220.0 / 255.0) 
  // #DC143C
  #define crimson vec3(220.0 / 255.0, 20.0 / 255.0, 60.0 / 255.0) 
  // #00FFFF
  #define cyan vec3(0.0 / 255.0, 255.0 / 255.0, 255.0 / 255.0) 
  // #00008B
  #define darkblue vec3(0.0 / 255.0, 0.0 / 255.0, 139.0 / 255.0) 
  // #008B8B
  #define darkcyan vec3(0.0 / 255.0, 139.0 / 255.0, 139.0 / 255.0) 
  // #B8860B
  #define darkgoldenrod vec3(184.0 / 255.0, 134.0 / 255.0, 11.0 / 255.0) 
  // #A9A9A9
  #define darkgray vec3(169.0 / 255.0, 169.0 / 255.0, 169.0 / 255.0) 
  // #A9A9A9
  #define darkgrey vec3(169.0 / 255.0, 169.0 / 255.0, 169.0 / 255.0) 
  // #006400
  #define darkgreen vec3(0.0 / 255.0, 100.0 / 255.0, 0.0 / 255.0) 
  // #BDB76B
  #define darkkhaki vec3(189.0 / 255.0, 183.0 / 255.0, 107.0 / 255.0) 
  // #8B008B
  #define darkmagenta vec3(139.0 / 255.0, 0.0 / 255.0, 139.0 / 255.0) 
  // #556B2F
  #define darkolivegreen vec3(85.0 / 255.0, 107.0 / 255.0, 47.0 / 255.0) 
  // #FF8C00
  #define darkorange vec3(255.0 / 255.0, 140.0 / 255.0, 0.0 / 255.0) 
  // #9932CC
  #define darkorchid vec3(153.0 / 255.0, 50.0 / 255.0, 204.0 / 255.0) 
  // #8B0000
  #define darkred vec3(139.0 / 255.0, 0.0 / 255.0, 0.0 / 255.0) 
  // #E9967A
  #define darksalmon vec3(233.0 / 255.0, 150.0 / 255.0, 122.0 / 255.0) 
  // #8FBC8F
  #define darkseagreen vec3(143.0 / 255.0, 188.0 / 255.0, 143.0 / 255.0) 
  // #483D8B
  #define darkslateblue vec3(72.0 / 255.0, 61.0 / 255.0, 139.0 / 255.0) 
  // #2F4F4F
  #define darkslategray vec3(47.0 / 255.0, 79.0 / 255.0, 79.0 / 255.0) 
  // #2F4F4F
  #define darkslategrey vec3(47.0 / 255.0, 79.0 / 255.0, 79.0 / 255.0) 
  // #00CED1
  #define darkturquoise vec3(0.0 / 255.0, 206.0 / 255.0, 209.0 / 255.0) 
  // #9400D3
  #define darkviolet vec3(148.0 / 255.0, 0.0 / 255.0, 211.0 / 255.0) 
  // #FF1493
  #define deeppink vec3(255.0 / 255.0, 20.0 / 255.0, 147.0 / 255.0) 
  // #00BFFF
  #define deepskyblue vec3(0.0 / 255.0, 191.0 / 255.0, 255.0 / 255.0) 
  // #696969
  #define dimgray vec3(105.0 / 255.0, 105.0 / 255.0, 105.0 / 255.0) 
  // #696969
  #define dimgrey vec3(105.0 / 255.0, 105.0 / 255.0, 105.0 / 255.0) 
  // #1E90FF
  #define dodgerblue vec3(30.0 / 255.0, 144.0 / 255.0, 255.0 / 255.0) 
  // #B22222
  #define firebrick vec3(178.0 / 255.0, 34.0 / 255.0, 34.0 / 255.0) 
  // #FFFAF0
  #define floralwhite vec3(255.0 / 255.0, 250.0 / 255.0, 240.0 / 255.0) 
  // #228B22
  #define forestgreen vec3(34.0 / 255.0, 139.0 / 255.0, 34.0 / 255.0) 
  // #FF00FF
  #define fuchsia vec3(255.0 / 255.0, 0.0 / 255.0, 255.0 / 255.0) 
  // #DCDCDC
  #define gainsboro vec3(220.0 / 255.0, 220.0 / 255.0, 220.0 / 255.0) 
  // #F8F8FF
  #define ghostwhite vec3(248.0 / 255.0, 248.0 / 255.0, 255.0 / 255.0) 
  // #FFD700
  #define gold vec3(255.0 / 255.0, 215.0 / 255.0, 0.0 / 255.0) 
  // #DAA520
  #define goldenrod vec3(218.0 / 255.0, 165.0 / 255.0, 32.0 / 255.0) 
  // #808080
  #define gray vec3(128.0 / 255.0, 128.0 / 255.0, 128.0 / 255.0) 
  // #808080
  #define grey vec3(128.0 / 255.0, 128.0 / 255.0, 128.0 / 255.0) 
  // #008000
  #define green vec3(0.0 / 255.0, 128.0 / 255.0, 0.0 / 255.0) 
  // #ADFF2F
  #define greenyellow vec3(173.0 / 255.0, 255.0 / 255.0, 47.0 / 255.0) 
  // #F0FFF0
  #define honeydew vec3(240.0 / 255.0, 255.0 / 255.0, 240.0 / 255.0) 
  // #FF69B4
  #define hotpink vec3(255.0 / 255.0, 105.0 / 255.0, 180.0 / 255.0) 
  // #CD5C5C
  #define indianred vec3(205.0 / 255.0, 92.0 / 255.0, 92.0 / 255.0) 
  // #4B0082
  #define indigo vec3(75.0 / 255.0, 0.0 / 255.0, 130.0 / 255.0) 
  // #FFFFF0
  #define ivory vec3(255.0 / 255.0, 255.0 / 255.0, 240.0 / 255.0) 
  // #F0E68C
  #define khaki vec3(240.0 / 255.0, 230.0 / 255.0, 140.0 / 255.0) 
  // #E6E6FA
  #define lavender vec3(230.0 / 255.0, 230.0 / 255.0, 250.0 / 255.0) 
  // #FFF0F5
  #define lavenderblush vec3(255.0 / 255.0, 240.0 / 255.0, 245.0 / 255.0) 
  // #7CFC00
  #define lawngreen vec3(124.0 / 255.0, 252.0 / 255.0, 0.0 / 255.0) 
  // #FFFACD
  #define lemonchiffon vec3(255.0 / 255.0, 250.0 / 255.0, 205.0 / 255.0) 
  // #ADD8E6
  #define lightblue vec3(173.0 / 255.0, 216.0 / 255.0, 230.0 / 255.0) 
  // #F08080
  #define lightcoral vec3(240.0 / 255.0, 128.0 / 255.0, 128.0 / 255.0) 
  // #E0FFFF
  #define lightcyan vec3(224.0 / 255.0, 255.0 / 255.0, 255.0 / 255.0) 
  // #FAFAD2
  #define lightgoldenrodyellow vec3(250.0 / 255.0, 250.0 / 255.0, 210.0 / 255.0) 
  // #D3D3D3
  #define lightgray vec3(211.0 / 255.0, 211.0 / 255.0, 211.0 / 255.0) 
  // #D3D3D3
  #define lightgrey vec3(211.0 / 255.0, 211.0 / 255.0, 211.0 / 255.0) 
  // #90EE90
  #define lightgreen vec3(144.0 / 255.0, 238.0 / 255.0, 144.0 / 255.0) 
  // #FFB6C1
  #define lightpink vec3(255.0 / 255.0, 182.0 / 255.0, 193.0 / 255.0) 
  // #FFA07A
  #define lightsalmon vec3(255.0 / 255.0, 160.0 / 255.0, 122.0 / 255.0) 
  // #20B2AA
  #define lightseagreen vec3(32.0 / 255.0, 178.0 / 255.0, 170.0 / 255.0) 
  // #87CEFA
  #define lightskyblue vec3(135.0 / 255.0, 206.0 / 255.0, 250.0 / 255.0) 
  // #778899
  #define lightslategray vec3(119.0 / 255.0, 136.0 / 255.0, 153.0 / 255.0) 
  // #778899
  #define lightslategrey vec3(119.0 / 255.0, 136.0 / 255.0, 153.0 / 255.0) 
  // #B0C4DE
  #define lightsteelblue vec3(176.0 / 255.0, 196.0 / 255.0, 222.0 / 255.0) 
  // #FFFFE0
  #define lightyellow vec3(255.0 / 255.0, 255.0 / 255.0, 224.0 / 255.0) 
  // #00FF00
  #define lime vec3(0.0 / 255.0, 255.0 / 255.0, 0.0 / 255.0) 
  // #32CD32
  #define limegreen vec3(50.0 / 255.0, 205.0 / 255.0, 50.0 / 255.0) 
  // #FAF0E6
  #define linen vec3(250.0 / 255.0, 240.0 / 255.0, 230.0 / 255.0) 
  // #FF00FF
  #define magenta vec3(255.0 / 255.0, 0.0 / 255.0, 255.0 / 255.0) 
  // #800000
  #define maroon vec3(128.0 / 255.0, 0.0 / 255.0, 0.0 / 255.0) 
  // #66CDAA
  #define mediumaquamarine vec3(102.0 / 255.0, 205.0 / 255.0, 170.0 / 255.0) 
  // #0000CD
  #define mediumblue vec3(0.0 / 255.0, 0.0 / 255.0, 205.0 / 255.0) 
  // #BA55D3
  #define mediumorchid vec3(186.0 / 255.0, 85.0 / 255.0, 211.0 / 255.0) 
  // #9370DB
  #define mediumpurple vec3(147.0 / 255.0, 112.0 / 255.0, 219.0 / 255.0) 
  // #3CB371
  #define mediumseagreen vec3(60.0 / 255.0, 179.0 / 255.0, 113.0 / 255.0) 
  // #7B68EE
  #define mediumslateblue vec3(123.0 / 255.0, 104.0 / 255.0, 238.0 / 255.0) 
  // #00FA9A
  #define mediumspringgreen vec3(0.0 / 255.0, 250.0 / 255.0, 154.0 / 255.0) 
  // #48D1CC
  #define mediumturquoise vec3(72.0 / 255.0, 209.0 / 255.0, 204.0 / 255.0) 
  // #C71585
  #define mediumvioletred vec3(199.0 / 255.0, 21.0 / 255.0, 133.0 / 255.0) 
  // #191970
  #define midnightblue vec3(25.0 / 255.0, 25.0 / 255.0, 112.0 / 255.0) 
  // #F5FFFA
  #define mintcream vec3(245.0 / 255.0, 255.0 / 255.0, 250.0 / 255.0) 
  // #FFE4E1
  #define mistyrose vec3(255.0 / 255.0, 228.0 / 255.0, 225.0 / 255.0) 
  // #FFE4B5
  #define moccasin vec3(255.0 / 255.0, 228.0 / 255.0, 181.0 / 255.0) 
  // #FFDEAD
  #define navajowhite vec3(255.0 / 255.0, 222.0 / 255.0, 173.0 / 255.0) 
  // #000080
  #define navy vec3(0.0 / 255.0, 0.0 / 255.0, 128.0 / 255.0) 
  // #FDF5E6
  #define oldlace vec3(253.0 / 255.0, 245.0 / 255.0, 230.0 / 255.0) 
  // #808000
  #define olive vec3(128.0 / 255.0, 128.0 / 255.0, 0.0 / 255.0) 
  // #6B8E23
  #define olivedrab vec3(107.0 / 255.0, 142.0 / 255.0, 35.0 / 255.0) 
  // #FFA500
  #define orange vec3(255.0 / 255.0, 165.0 / 255.0, 0.0 / 255.0) 
  // #FF4500
  #define orangered vec3(255.0 / 255.0, 69.0 / 255.0, 0.0 / 255.0) 
  // #DA70D6
  #define orchid vec3(218.0 / 255.0, 112.0 / 255.0, 214.0 / 255.0) 
  // #EEE8AA
  #define palegoldenrod vec3(238.0 / 255.0, 232.0 / 255.0, 170.0 / 255.0) 
  // #98FB98
  #define palegreen vec3(152.0 / 255.0, 251.0 / 255.0, 152.0 / 255.0) 
  // #AFEEEE
  #define paleturquoise vec3(175.0 / 255.0, 238.0 / 255.0, 238.0 / 255.0) 
  // #DB7093
  #define palevioletred vec3(219.0 / 255.0, 112.0 / 255.0, 147.0 / 255.0) 
  // #FFEFD5
  #define papayawhip vec3(255.0 / 255.0, 239.0 / 255.0, 213.0 / 255.0) 
  // #FFDAB9
  #define peachpuff vec3(255.0 / 255.0, 218.0 / 255.0, 185.0 / 255.0) 
  // #CD853F
  #define peru vec3(205.0 / 255.0, 133.0 / 255.0, 63.0 / 255.0) 
  // #FFC0CB
  #define pink vec3(255.0 / 255.0, 192.0 / 255.0, 203.0 / 255.0) 
  // #DDA0DD
  #define plum vec3(221.0 / 255.0, 160.0 / 255.0, 221.0 / 255.0) 
  // #B0E0E6
  #define powderblue vec3(176.0 / 255.0, 224.0 / 255.0, 230.0 / 255.0) 
  // #800080
  #define purple vec3(128.0 / 255.0, 0.0 / 255.0, 128.0 / 255.0) 
  // #663399
  #define rebeccapurple vec3(102.0 / 255.0, 51.0 / 255.0, 153.0 / 255.0) 
  // #FF0000
  #define red vec3(255.0 / 255.0, 0.0 / 255.0, 0.0 / 255.0) 
  // #BC8F8F
  #define rosybrown vec3(188.0 / 255.0, 143.0 / 255.0, 143.0 / 255.0) 
  // #4169E1
  #define royalblue vec3(65.0 / 255.0, 105.0 / 255.0, 225.0 / 255.0) 
  // #8B4513
  #define saddlebrown vec3(139.0 / 255.0, 69.0 / 255.0, 19.0 / 255.0) 
  // #FA8072
  #define salmon vec3(250.0 / 255.0, 128.0 / 255.0, 114.0 / 255.0) 
  // #F4A460
  #define sandybrown vec3(244.0 / 255.0, 164.0 / 255.0, 96.0 / 255.0) 
  // #2E8B57
  #define seagreen vec3(46.0 / 255.0, 139.0 / 255.0, 87.0 / 255.0) 
  // #FFF5EE
  #define seashell vec3(255.0 / 255.0, 245.0 / 255.0, 238.0 / 255.0) 
  // #A0522D
  #define sienna vec3(160.0 / 255.0, 82.0 / 255.0, 45.0 / 255.0) 
  // #C0C0C0
  #define silver vec3(192.0 / 255.0, 192.0 / 255.0, 192.0 / 255.0) 
  // #87CEEB
  #define skyblue vec3(135.0 / 255.0, 206.0 / 255.0, 235.0 / 255.0) 
  // #6A5ACD
  #define slateblue vec3(106.0 / 255.0, 90.0 / 255.0, 205.0 / 255.0) 
  // #708090
  #define slategray vec3(112.0 / 255.0, 128.0 / 255.0, 144.0 / 255.0) 
  // #708090
  #define slategrey vec3(112.0 / 255.0, 128.0 / 255.0, 144.0 / 255.0) 
  // #FFFAFA
  #define snow vec3(255.0 / 255.0, 250.0 / 255.0, 250.0 / 255.0) 
  // #00FF7F
  #define springgreen vec3(0.0 / 255.0, 255.0 / 255.0, 127.0 / 255.0) 
  // #4682B4
  #define steelblue vec3(70.0 / 255.0, 130.0 / 255.0, 180.0 / 255.0) 
  // #D2B48C
  #define tan_color vec3(210.0 / 255.0, 180.0 / 255.0, 140.0 / 255.0) 
  // #008080
  #define teal vec3(0.0 / 255.0, 128.0 / 255.0, 128.0 / 255.0) 
  // #D8BFD8
  #define thistle vec3(216.0 / 255.0, 191.0 / 255.0, 216.0 / 255.0) 
  // #FF6347
  #define tomato vec3(255.0 / 255.0, 99.0 / 255.0, 71.0 / 255.0) 
  // #40E0D0
  #define turquoise vec3(64.0 / 255.0, 224.0 / 255.0, 208.0 / 255.0) 
  // #EE82EE
  #define violet vec3(238.0 / 255.0, 130.0 / 255.0, 238.0 / 255.0) 
  // #F5DEB3
  #define wheat vec3(245.0 / 255.0, 222.0 / 255.0, 179.0 / 255.0) 
  // #FFFFFF
  #define white vec3(255.0 / 255.0, 255.0 / 255.0, 255.0 / 255.0) 
  // #F5F5F5
  #define whitesmoke vec3(245.0 / 255.0, 245.0 / 255.0, 245.0 / 255.0) 
  // #FFFF00
  #define yellow vec3(255.0 / 255.0, 255.0 / 255.0, 0.0 / 255.0) 
  // #9ACD32
  #define yellowgreen vec3(154.0 / 255.0, 205.0 / 255.0, 50.0 / 255.0) 
`
