using System.Linq;
using System.Web.Http;
using Microsoft.Owin;
using Microsoft.Owin.Extensions;
using Microsoft.Owin.FileSystems;
using Microsoft.Owin.StaticFiles;
using ngOwinApi;
using Owin;

[assembly: OwinStartup(typeof(ngOwinSpa.Startup))]
namespace ngOwinSpa
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            var config = new HttpConfiguration();

            // Web API
            app.UseWebApi(config);
            ApiStartup.Register(config);

            // JSON payload by default.
            var appXmlType = config.Formatters.XmlFormatter.SupportedMediaTypes.FirstOrDefault(t => t.MediaType == "application/xml");
            config.Formatters.XmlFormatter.SupportedMediaTypes.Remove(appXmlType);

            app.UseFileServer(new FileServerOptions
            {
                RequestPath = new PathString(string.Empty),
                FileSystem = new PhysicalFileSystem("./public")
            });

            app.UseStageMarker(PipelineStage.MapHandler);
        }
    }
}
