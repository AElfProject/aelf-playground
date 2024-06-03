import type { TupleFiles } from "../../../utils/pg";

export const files: TupleFiles = [
  [
    "src/Protobuf/contract/hello_world_contract.proto",
    require("./src/Protobuf/contract/hello_world_contract.proto"),
  ],
  [
    "src/Protobuf/message/authority_info.proto",
    require("./src/Protobuf/message/authority_info.proto"),
  ],
  ["src/HelloWorld.cs", require("./src/HelloWorld.cs")],
  ["src/HelloWorld.csproj", require("./src/HelloWorld.csproj")],
  ["src/HelloWorldState.cs", require("./src/HelloWorldState.cs")],
  ["client/client.ts", require("./client/client.ts.raw")],
];
