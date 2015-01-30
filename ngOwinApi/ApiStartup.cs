using System.Web.Http;

namespace ngOwinApi
{
    public static class ApiStartup
    {
        public static void Register(HttpConfiguration config)
        {
            config.MapHttpAttributeRoutes();
        }
    }
}
