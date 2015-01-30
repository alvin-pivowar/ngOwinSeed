using System;
using System.Web.Http;
using ngOwinApi.Resources;

namespace ngOwinApi.Endpoints
{
    [AllowAnonymous]
    [RoutePrefix("api/test")]
    public class TestController : ApiController
    {
        [HttpGet]
        [Route("greeting")]
        public IHttpActionResult Greeting()
        {
            return Ok("Greetings from Web API.");
        }

        [HttpGet]
        [Route("echo")]
        public IHttpActionResult GetEcho()
        {
            return Ok(new EchoResource
            {
                id = Guid.NewGuid().ToString(),
                message = "Response from GET /api/echo",
                timestamp = DateTime.UtcNow
            });
        }

        [HttpPost]
        [Route("echo")]
        public IHttpActionResult PostEcho()
        {
            string message = Request.Content.ReadAsStringAsync().Result;
            if (String.IsNullOrWhiteSpace(message))
                message = "What! Nothing to say?";

            return Ok(new EchoResource
            {
                id = Guid.NewGuid().ToString(),
                message = message,
                timestamp = DateTime.UtcNow
            });
        }
    }
}
