{ pkgs ? import <nixpkgs> {} }:

pkgs.stdenv.mkDerivation {
  name = "qr-service";
  
  src = ./.;

  buildInputs = [ pkgs.nodejs ];

  buildPhase = ''
    npm install
    npm run build
  '';

  installPhase = ''
    mkdir -p $out
    cp -r dist $out/dist
    cp package.json $out/package.json
    cp -r node_modules $out/node_modules
  '';
}
