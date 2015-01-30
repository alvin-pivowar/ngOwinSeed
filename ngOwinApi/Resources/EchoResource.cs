using System;

namespace ngOwinApi.Resources
{
    public class EchoResource
    {
        public string id { get; set; }
        public string message { get; set; }
        public DateTime timestamp { get; set; }
    }
}
