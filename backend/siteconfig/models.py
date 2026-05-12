from django.db import models


class SiteSettings(models.Model):
    """Singleton model storing all CMS-driven frontend content.

    Only one row ever exists (pk=1). Use ``SiteSettings.get_settings()``
    to retrieve or create the default instance. All fields have safe
    defaults so the frontend works correctly before any admin edits.

    Security notes:
    - All text fields have explicit ``max_length`` to bound stored data.
    - No ``HTMLField`` or rich-text — content is rendered as plain text
      on the frontend (never via ``dangerouslySetInnerHTML``).
    """

    # ------------------------------------------------------------------ #
    # Branding                                                             #
    # ------------------------------------------------------------------ #
    site_name = models.CharField(
        max_length=100,
        default="Community Portal",
        help_text="[EN] Displayed in the browser tab title and footer.",
    )
    site_name_pt = models.CharField(
        max_length=100,
        default="Portal Comunitário",
        help_text="[PT] Apresentado no título do separador do navegador e no rodapé.",
    )
    site_tagline = models.CharField(
        max_length=255,
        default="Report issues in your community",
        help_text="[EN] Short tagline shown in meta descriptions / SEO.",
    )
    site_tagline_pt = models.CharField(
        max_length=255,
        default="Relate problemas na sua comunidade",
        help_text="[PT] Slogan curto exibido nas meta descrições / SEO.",
    )

    # ------------------------------------------------------------------ #
    # Navbar                                                               #
    # ------------------------------------------------------------------ #
    navbar_brand_text = models.CharField(
        max_length=100,
        default="Community Portal",
        help_text="[EN] Brand name shown in the top navigation bar.",
    )
    navbar_brand_text_pt = models.CharField(
        max_length=100,
        default="Portal Comunitário",
        help_text="[PT] Nome da marca exibido na barra de navegação superior.",
    )
    navbar_cta_text = models.CharField(
        max_length=60,
        default="New Report",
        help_text="[EN] Label for the primary call-to-action button in the navbar.",
    )
    navbar_cta_text_pt = models.CharField(
        max_length=60,
        default="Novo Relato",
        help_text="[PT] Rótulo para o botão de ação principal na barra de navegação.",
    )

    # ------------------------------------------------------------------ #
    # Hero section (Home page)                                             #
    # ------------------------------------------------------------------ #
    hero_title = models.CharField(
        max_length=255,
        default="Make Your Community Better",
        help_text="[EN] Large heading displayed in the home page hero area.",
    )
    hero_title_pt = models.CharField(
        max_length=255,
        default="Torne a Sua Comunidade Melhor",
        help_text="[PT] Título grande exibido na área hero da página inicial.",
    )
    hero_subtitle = models.CharField(
        max_length=500,
        default=(
            "Help us improve your neighborhood. Report issues, "
            "track progress, and stay informed about local improvements."
        ),
        help_text="[EN] Subtitle paragraph below the hero heading.",
    )
    hero_subtitle_pt = models.CharField(
        max_length=500,
        default=(
            "Ajude-nos a melhorar o seu bairro. Relate problemas, "
            "acompanhe o progresso e mantenha-se informado sobre melhorias locais."
        ),
        help_text="[PT] Parágrafo de subtítulo abaixo do cabeçalho hero.",
    )
    hero_cta_text = models.CharField(
        max_length=60,
        default="Submit a Report",
        help_text="[EN] Label for the hero call-to-action button.",
    )
    hero_cta_text_pt = models.CharField(
        max_length=60,
        default="Submeter Relato",
        help_text="[PT] Rótulo para o botão de ação do hero.",
    )

    # ------------------------------------------------------------------ #
    # Empty state (Home page – no reports)                                 #
    # ------------------------------------------------------------------ #
    empty_state_title = models.CharField(
        max_length=255,
        default="No reports found",
        help_text="[EN] Heading shown when the reports list is empty.",
    )
    empty_state_title_pt = models.CharField(
        max_length=255,
        default="Nenhum relato encontrado",
        help_text="[PT] Título exibido quando a lista de relatos está vazia.",
    )
    empty_state_body = models.CharField(
        max_length=500,
        default="Be the first to report an issue in your area.",
        help_text="[EN] Body text shown when the reports list is empty.",
    )
    empty_state_body_pt = models.CharField(
        max_length=500,
        default="Seja o primeiro a relatar um problema na sua área.",
        help_text="[PT] Texto exibido quando a lista de relatos está vazia.",
    )

    # ------------------------------------------------------------------ #
    # About page                                                           #
    # ------------------------------------------------------------------ #
    about_title = models.CharField(
        max_length=255,
        default="About Community Portal",
        help_text="[EN] Heading for the About page.",
    )
    about_title_pt = models.CharField(
        max_length=255,
        default="Sobre o Portal Comunitário",
        help_text="[PT] Título para a página Sobre.",
    )
    about_body = models.TextField(
        max_length=5000,
        default=(
            "Community Portal is a community-driven platform designed to "
            "bridge the gap between citizens and local authorities. By "
            "providing a transparent and easy-to-use interface for reporting "
            "infrastructure, safety, and environmental issues, we empower "
            "residents to take an active role in improving their neighborhoods."
        ),
        help_text="[EN] Main body text for the About page.",
    )
    about_body_pt = models.TextField(
        max_length=5000,
        default=(
            "O Portal Comunitário é uma plataforma impulsionada pela comunidade "
            "projetada para aproximar cidadãos e autoridades locais. Ao fornecer "
            "uma interface transparente e fácil de usar para relatar problemas "
            "de infraestrutura, segurança e ambientais, capacitamos os "
            "residentes a desempenharem um papel ativo na melhoria dos seus bairros."
        ),
        help_text="[PT] Texto principal para a página Sobre.",
    )

    # ------------------------------------------------------------------ #
    # Footer                                                               #
    # ------------------------------------------------------------------ #
    footer_copyright_text = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text=(
            "[EN] Optional extra copyright or legal text shown in the footer."
        ),
    )
    footer_copyright_text_pt = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text=(
            "[PT] Texto opcional de copyright ou legal exibido no rodapé."
        ),
    )

    # ------------------------------------------------------------------ #
    # Report Detail page                                                   #
    # ------------------------------------------------------------------ #
    detail_official_response_label = models.CharField(
        max_length=100,
        default="Official Response",
        help_text="[EN] Heading for resolution-comment card.",
    )
    detail_official_response_label_pt = models.CharField(
        max_length=100,
        default="Resposta Oficial",
        help_text="[PT] Título para o cartão de comentário de resolução.",
    )
    detail_support_title = models.CharField(
        max_length=100,
        default="Need Help?",
        help_text="[EN] Heading for support card.",
    )
    detail_support_title_pt = models.CharField(
        max_length=100,
        default="Precisa de Ajuda?",
        help_text="[PT] Título para o cartão de suporte.",
    )
    detail_support_body = models.CharField(
        max_length=500,
        default=(
            "If you have more information about this issue, "
            "please contact our community support team."
        ),
        help_text="[EN] Body text for the support card.",
    )
    detail_support_body_pt = models.CharField(
        max_length=500,
        default=(
            "Se tiver mais informações sobre este problema, "
            "entre em contacto com a nossa equipa de apoio comunitário."
        ),
        help_text="[PT] Texto para o cartão de suporte.",
    )

    # ------------------------------------------------------------------ #
    # Privacy Policy, Terms, and Contact                                   #
    # ------------------------------------------------------------------ #
    contact_email = models.EmailField(
        max_length=254,
        blank=True,
        default="",
        help_text="Email address where contact form submissions are sent.",
    )
    privacy_body = models.TextField(
        max_length=10000,
        blank=True,
        default="",
        help_text="[EN] Privacy policy body text.",
    )
    privacy_body_pt = models.TextField(
        max_length=10000,
        blank=True,
        default="",
        help_text="[PT] Texto do corpo da política de privacidade.",
    )
    terms_body = models.TextField(
        max_length=10000,
        blank=True,
        default="",
        help_text="[EN] Terms of service body text.",
    )
    terms_body_pt = models.TextField(
        max_length=10000,
        blank=True,
        default="",
        help_text="[PT] Texto do corpo dos termos de serviço.",
    )

    class Meta:
        verbose_name = "Site Settings"
        verbose_name_plural = "Site Settings"

    def __str__(self) -> str:
        return "Site Settings"

    def save(self, *args, **kwargs) -> None:
        """Enforce the singleton pattern: always save as pk=1."""
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls) -> "SiteSettings":
        """Return the single settings instance, creating it if absent."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class ContactSubmission(models.Model):
    """A message submitted via the public contact form."""

    name = models.CharField(max_length=200, blank=True, default="")
    email = models.EmailField(max_length=254)
    message = models.TextField(max_length=5000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Contact Submission"
        verbose_name_plural = "Contact Submissions"

    def __str__(self) -> str:
        return f"{self.email} - {self.created_at:%Y-%m-%d}"
