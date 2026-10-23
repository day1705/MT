''' 23:28 13.11.2025
''' GWS to JS converter
''' drag & drop gws file into this script

  GwsToJs

  sub GwsToJs()
    set arg = wscript.arguments
    if arg.count = 0 or right(arg(0),4)<> ".gws" then exit sub
    OpenGWS arg(0)
  end sub
  
  sub OpenGWS(fname)
    setlocale("en-gb")
    set xo = getobject("script:https://day1705.github.io/MT/CTe.png")
    ' set go = getobject("script:https://day1705.github.io/MT/G3e.png")
    s = xo.mt.readfile(fname)
    if right(s, 2) = vbcrlf then s = mid(s, 1, len(s)-2)
    n = instr(s, "#12")
    s = mid(s, n)
    s = replace(s, "     ", chr(32))
    s = replace(s,  "    ", chr(32))
    s = replace(s,   "   ", chr(32))
    a1 = split(s, vbcrlf)
    for i=0 to ubound(a1)
      aline = split(a1(i), chr(32))
      s1 = s1 + "v " + cstr(formatnumber(cdbl(aline(1)),2)) + " " + cstr(formatnumber(cdbl(aline(2)),2)) + " " + cstr(formatnumber(cdbl(aline(3)),2)) + vbcrlf
    next
    
    xo.mt.writefile fname + "_cad.txt", s1
    SetAsJS xo, fname + "_js_var.txt", s1
  end sub
  
  sub SetAsJS(zo, fname, s)
    if right(s, 2) = vbcrlf then s = mid(s, 1, len(s) - 2)
    s = replace(s, vbcrlf, "$")
    s = "var text = " + chr(34) + s + chr(34) + ";"
    zo.mt.writefile fname, s
  end sub
