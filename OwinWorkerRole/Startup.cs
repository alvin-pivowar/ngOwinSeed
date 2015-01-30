using System.Linq;
using System.Web.Http;
using Microsoft.Owin;
using Microsoft.Owin.Extensions;
using Microsoft.Owin.FileSystems;
using Microsoft.Owin.StaticFiles;
using ngOwinApi;
using Owin;

namespace OwinWorkerRole
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            //app.UseWelcomePage("/");

            var config = new HttpConfiguration();

            // Web API
            ApiStartup.Register(config);
            app.UseWebApi(config);

            // JSON payload by default.
            var appXmlType = config.Formatters.XmlFormatter.SupportedMediaTypes.FirstOrDefault(t => t.MediaType == "application/xml");
            config.Formatters.XmlFormatter.SupportedMediaTypes.Remove(appXmlType);

            app.MapSignalR();

            // File Server (Use public folder from SPA project.)
            app.UseFileServer(new FileServerOptions
            {
                RequestPath = new PathString(string.Empty),
                FileSystem = new PhysicalFileSystem("../../../../../../ngOwinSpa/public")
            });

            app.UseStageMarker(PipelineStage.MapHandler);
        }
    }
}
